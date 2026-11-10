-- 07_audit_spine.sql
--
-- Apply after 06_media_provider.sql.
--
-- The audit trail is written by triggers, not by the client. That matters:
-- migration 04 revoked INSERT/UPDATE/DELETE on `audit_logs` from `anon` and
-- `authenticated`, so a caller cannot forge or erase an entry. A trigger runs
-- with the table owner's privileges and fires no matter which path performed
-- the write (PostgREST through Laravel, or Laravel's own direct connection).
--
-- Recorded for every change:
--   * actor id / name / role, snapshotted so later renames do not rewrite history
--   * entity type, entity id and a human-readable description
--   * the names of the columns that changed (never the values, so passwords,
--     quiz answers and lab solutions are never copied into the log)
--   * INFO for creates/updates, WARNING for deletes and for role/status changes
--
-- Updates that change nothing are skipped, so saving an unchanged form does
-- not flood the log.

BEGIN;

-- Administrator reach over profiles. `users` previously had only a self-update
-- policy, so the User Management screen's edit and delete calls matched zero
-- rows without raising an error. This keeps self-service intact (permissive
-- policies are OR-ed) and makes administrators the editor of last resort.
DROP POLICY IF EXISTS "administrators manage users" ON public.users;
CREATE POLICY "administrators manage users" ON public.users
  FOR ALL
  USING ((public.current_profile_role())::text = 'Administrator')
  WITH CHECK ((public.current_profile_role())::text = 'Administrator');

-- Administrator reach does not include credential or privilege takeover. The
-- data API has no column-level restriction by itself, so a browser session
-- could otherwise rewrite another account's password hash or auth identity, or
-- promote itself by editing its own `type`. Signed-in callers may change only
-- their own display fields; the trusted server connection (no JWT claims, used
-- by Laravel for signup and password reset) is unaffected.
CREATE OR REPLACE FUNCTION public.guard_user_credentials() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = public, pg_temp
  AS $$
DECLARE
  v_actor_id bigint := public.current_profile_id();
  v_actor_role varchar := public.current_profile_role();
BEGIN
  -- No JWT claims means a trusted server connection (lms_service/service_role).
  IF v_actor_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Credentials never change through the data API, for anyone.
  IF NEW.password IS DISTINCT FROM OLD.password
     OR NEW.auth_user_id IS DISTINCT FROM OLD.auth_user_id THEN
    RAISE EXCEPTION 'Changing credentials through the data API is not permitted'
      USING ERRCODE = '42501';
  END IF;

  -- Roles, identity and account status are administrator-only.
  IF v_actor_role IS DISTINCT FROM 'Administrator' AND (
       NEW.type IS DISTINCT FROM OLD.type
       OR NEW.email IS DISTINCT FROM OLD.email
       OR NEW.is_active IS DISTINCT FROM OLD.is_active
       OR NEW.partner_id IS DISTINCT FROM OLD.partner_id
       OR NEW.student_id IS DISTINCT FROM OLD.student_id
       OR NEW.force_password_change IS DISTINCT FROM OLD.force_password_change
     ) THEN
    RAISE EXCEPTION 'Only administrators can change roles, identity or account status'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_user_credentials ON public.users;
CREATE TRIGGER guard_user_credentials
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.guard_user_credentials();

CREATE OR REPLACE FUNCTION public.record_audit_row() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = public, pg_temp
  AS $$
DECLARE
  v_actor_id bigint := public.current_profile_id();
  v_actor_name text;
  v_actor_role text;
  v_entity_id bigint;
  v_action text;
  v_description text;
  v_severity text := 'INFO';
  v_old jsonb;
  v_new jsonb;
  v_changed text[] := '{}';
  v_label text;
  v_entity_label text;
  v_metadata jsonb;
BEGIN
  v_entity_label := CASE TG_TABLE_NAME
    WHEN 'users' THEN 'user'
    WHEN 'cohorts' THEN 'cohort'
    WHEN 'enrolments' THEN 'enrolment'
    WHEN 'modules' THEN 'module'
    WHEN 'lessons' THEN 'lesson'
    WHEN 'labs' THEN 'lab'
    WHEN 'assessments' THEN 'assessment'
    WHEN 'announcements' THEN 'announcement'
    WHEN 'partners' THEN 'partner agency'
    WHEN 'partner_courses' THEN 'partner course'
    WHEN 'partner_course_lessons' THEN 'partner course lesson'
    WHEN 'instructor_cohort_assignments' THEN 'instructor assignment'
    WHEN 'certifications' THEN 'certification'
    WHEN 'placements' THEN 'placement'
    ELSE TG_TABLE_NAME
  END;

  IF TG_OP = 'DELETE' THEN
    v_old := to_jsonb(OLD);
    v_entity_id := OLD.id;
    v_action := TG_TABLE_NAME || '.deleted';
    v_severity := 'WARNING';
  ELSIF TG_OP = 'UPDATE' THEN
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
    v_entity_id := NEW.id;
    v_action := TG_TABLE_NAME || '.updated';
    IF v_old IS NOT DISTINCT FROM v_new THEN
      RETURN NULL;
    END IF;
  ELSE
    v_new := to_jsonb(NEW);
    v_entity_id := NEW.id;
    v_action := TG_TABLE_NAME || '.created';
  END IF;

  -- Only updates have a meaningful changed-column list. For inserts and
  -- deletes every column is "new" or "gone", which is noise.
  IF TG_OP = 'UPDATE' THEN
    SELECT coalesce(array_agg(key ORDER BY key), '{}')
      INTO v_changed
      FROM jsonb_object_keys(v_new) AS key
      WHERE key NOT IN ('id', 'password', 'updated_at', 'created_at', 'last_login_at')
        AND (v_old ->> key) IS DISTINCT FROM (v_new ->> key);

    -- Logins touch last_login_at; an update with no meaningful change should
    -- not create an audit entry.
    IF coalesce(array_length(v_changed, 1), 0) = 0 THEN
      RETURN NULL;
    END IF;
  END IF;

  IF TG_OP = 'UPDATE'
     AND TG_TABLE_NAME IN ('users', 'partners', 'partner_courses', 'enrolments')
     AND v_changed && ARRAY['type', 'is_active', 'status', 'partner_id', 'track', 'cohort_id'] THEN
    v_severity := 'WARNING';
  END IF;

  IF v_actor_id IS NOT NULL THEN
    SELECT name, type INTO v_actor_name, v_actor_role
    FROM public.users
    WHERE id = v_actor_id;
  END IF;

  -- A user cannot be the actor of their own deletion: the FK would fail.
  IF TG_OP = 'DELETE' AND TG_TABLE_NAME = 'users' AND v_actor_id = v_entity_id THEN
    v_actor_id := NULL;
  END IF;

  v_label := coalesce(v_new ->> 'title', v_new ->> 'name', v_new ->> 'email',
                      v_old ->> 'title', v_old ->> 'name', v_old ->> 'email');

  v_description := CASE TG_OP
    WHEN 'INSERT' THEN
      'Created ' || v_entity_label || coalesce(' "' || v_label || '"', '')
    WHEN 'UPDATE' THEN
      'Updated ' || v_entity_label || coalesce(' "' || v_label || '"', '')
        || coalesce(' (' || array_to_string(v_changed, ', ') || ')', '')
    ELSE
      'Deleted ' || v_entity_label || coalesce(' "' || v_label || '"', '')
  END;

  v_metadata := jsonb_build_object(
    'table', TG_TABLE_NAME,
    'operation', TG_OP,
    'changed', to_jsonb(v_changed)
  );

  INSERT INTO public.audit_logs (
    user_id, user_name, user_role, action, entity_type, entity_id,
    description, metadata, severity
  ) VALUES (
    v_actor_id, v_actor_name, v_actor_role, v_action, TG_TABLE_NAME, v_entity_id,
    v_description, v_metadata, v_severity
  );

  RETURN NULL;
END;
$$;

DO $$
DECLARE
  t text;
  audited_tables text[] := ARRAY[
    'users',
    'cohorts',
    'enrolments',
    'modules',
    'lessons',
    'labs',
    'assessments',
    'announcements',
    'partners',
    'partner_courses',
    'partner_course_lessons',
    'instructor_cohort_assignments',
    'certifications',
    'placements'
  ];
BEGIN
  FOREACH t IN ARRAY audited_tables LOOP
    IF to_regclass('public.' || t) IS NULL THEN
      CONTINUE;
    END IF;
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', 'audit_' || t, t);
    EXECUTE format(
      'CREATE TRIGGER %I AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.record_audit_row()',
      'audit_' || t,
      t
    );
  END LOOP;
END;
$$;

COMMIT;
