-- 11_partner_profile_update.sql
--
-- Apply after 10_partner_enrolment_scope.sql.
--
-- Partners can now maintain their own organisation profile (name,
-- description, website, logo) instead of being sent to the personal profile
-- page. The policy scopes the row; the guard trigger freezes the columns the
-- academy owns, so a partner cannot self-approve, change the public slug, or
-- rewrite who created/approved the organisation.
--
-- Re-runnable: the policy and trigger are dropped and recreated.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Partners may update their own organisation row
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "partners update own organization" ON public.partners;
CREATE POLICY "partners update own organization" ON public.partners
  FOR UPDATE
  USING (
    id = public.current_partner_id()
    OR (public.current_profile_role())::text = 'Administrator'
  )
  WITH CHECK (
    id = public.current_partner_id()
    OR (public.current_profile_role())::text = 'Administrator'
  );

-- ---------------------------------------------------------------------------
-- 2. Guard the academy-owned columns
-- ---------------------------------------------------------------------------
--
-- Identity (`id`, `slug`), review state (`status`, approval metadata) and the
-- creation timestamp are not partner-writable. Administrators and server-side
-- service connections keep full control.

CREATE OR REPLACE FUNCTION public.guard_partner_profile()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  is_admin boolean := (public.current_profile_role() = 'Administrator');
  is_service boolean := current_user IN ('postgres', 'service_role', 'lms_service');
BEGIN
  IF is_admin OR is_service THEN
    RETURN NEW;
  END IF;

  NEW.id := OLD.id;
  NEW.slug := OLD.slug;
  NEW.status := OLD.status;
  NEW.created_by := OLD.created_by;
  NEW.approved_by := OLD.approved_by;
  NEW.approved_at := OLD.approved_at;
  NEW.created_at := OLD.created_at;
  NEW.updated_at := now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_partner_profile ON public.partners;
CREATE TRIGGER guard_partner_profile
  BEFORE UPDATE ON public.partners
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_partner_profile();

COMMIT;
