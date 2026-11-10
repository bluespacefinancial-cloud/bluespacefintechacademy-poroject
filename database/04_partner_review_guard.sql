-- 04_partner_review_guard.sql
--
-- Fail-closed hardening for the partner course review pipeline, notification
-- writes and instructor content scope. Apply after 03_demo_passwords.sql.
--
-- Background: the partner policies were `FOR ALL` on `partner_id` only, so a
-- partner could PATCH their own course to `published` and publish lesson rows
-- directly, bypassing the academy review step entirely. The notification
-- helper was also executable by `anon`, allowing anyone to write notifications
-- for any user. This migration closes both, and scopes instructor content
-- writes to the cohorts an instructor is actually assigned to.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Partner courses: reviewers own the review states
-- ---------------------------------------------------------------------------
--
-- A non-administrator may only create a draft and submit it, or resubmit a
-- course that was returned for changes. Every reviewer-owned column and
-- timestamp stays untouched.

CREATE OR REPLACE FUNCTION public.enforce_partner_course_review()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  is_admin boolean := (public.current_profile_role() = 'Administrator');
BEGIN
  IF is_admin THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- Partner content always starts as a draft, whatever the client sent.
    NEW.status := 'draft';
    NEW.submitted_at := NULL;
    NEW.approved_at := NULL;
    NEW.published_at := NULL;
    NEW.approved_by := NULL;
    NEW.rejection_reason := NULL;
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NOT (OLD.status IN ('draft', 'changes_requested') AND NEW.status = 'submitted') THEN
      RAISE EXCEPTION
        'Partner courses may only be submitted for review. Approval and publication are performed by an academy administrator.'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;

  -- Review metadata is never partner-writable.
  NEW.approved_at := OLD.approved_at;
  NEW.published_at := OLD.published_at;
  NEW.approved_by := OLD.approved_by;

  IF NEW.status = 'submitted' AND OLD.status IS DISTINCT FROM 'submitted' THEN
    NEW.submitted_at := now();
    NEW.rejection_reason := NULL;
  ELSE
    NEW.submitted_at := OLD.submitted_at;
    NEW.rejection_reason := OLD.rejection_reason;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_partner_course_review ON public.partner_courses;
CREATE TRIGGER enforce_partner_course_review
  BEFORE INSERT OR UPDATE ON public.partner_courses
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_partner_course_review();

-- ---------------------------------------------------------------------------
-- 2. Partner lessons: not publishable until the course is published
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.enforce_partner_lesson_publish()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  is_admin boolean := (public.current_profile_role() = 'Administrator');
BEGIN
  IF is_admin THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.is_published := false;
    RETURN NEW;
  END IF;

  -- Publication follows the course review, not an individual lesson edit.
  NEW.is_published := OLD.is_published;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_partner_lesson_publish ON public.partner_course_lessons;
CREATE TRIGGER enforce_partner_lesson_publish
  BEFORE INSERT OR UPDATE ON public.partner_course_lessons
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_partner_lesson_publish();

-- ---------------------------------------------------------------------------
-- 2b. Administrators must be able to manage partner lessons
-- ---------------------------------------------------------------------------
--
-- `partner_course_lessons` only had a partner policy and a student read
-- policy, so an administrator could neither correct partner content nor
-- publish it during review. Administrators are the editor of last resort.

DROP POLICY IF EXISTS "administrators manage partner lessons" ON public.partner_course_lessons;
CREATE POLICY "administrators manage partner lessons" ON public.partner_course_lessons
  FOR ALL
  USING ((public.current_profile_role())::text = 'Administrator')
  WITH CHECK ((public.current_profile_role())::text = 'Administrator');

-- ---------------------------------------------------------------------------
-- 3. Keep lesson visibility in step with the course state
-- ---------------------------------------------------------------------------
--
-- Students can only read lessons whose `is_published` is true, so approval has
-- to publish the lesson rows. Leaving the state also unpublishes them, which
-- keeps a withdrawn or archived course from leaking content.
--
-- The function runs as its owner so the synchronisation is not dependent on
-- the reviewer's row policies. It only acts on the course whose status write
-- already passed the partner_courses policy.

CREATE OR REPLACE FUNCTION public.sync_partner_lesson_publication()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'published' AND OLD.status IS DISTINCT FROM 'published' THEN
    UPDATE public.partner_course_lessons
       SET is_published = true,
           updated_at = now()
     WHERE course_id = NEW.id
       AND is_published = false;
  ELSIF NEW.status <> 'published' AND OLD.status = 'published' THEN
    UPDATE public.partner_course_lessons
       SET is_published = false,
           updated_at = now()
     WHERE course_id = NEW.id
       AND is_published = true;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS sync_partner_lesson_publication ON public.partner_courses;
CREATE TRIGGER sync_partner_lesson_publication
  AFTER UPDATE OF status ON public.partner_courses
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_partner_lesson_publication();

-- ---------------------------------------------------------------------------
-- 4. Notifications: no client-executable writes
-- ---------------------------------------------------------------------------
--
-- `create_notification` is SECURITY DEFINER and was granted to `anon` and
-- `authenticated`, so any caller could insert a notification row for any
-- user_id. Notifications are produced by database triggers (which run as the
-- definer) and by Laravel through `service_role`, so client roles do not need
-- the grant.
--
-- `PUBLIC` also receives EXECUTE by default on every new function, so it has
-- to be revoked explicitly as well.

REVOKE ALL ON FUNCTION public.create_notification(bigint, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_notification(bigint, text, text) FROM anon;
REVOKE ALL ON FUNCTION public.create_notification(bigint, text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.create_notification(bigint, text, text) TO service_role;

-- ---------------------------------------------------------------------------
-- 5. Audit log: append-only for the service, read-only for administrators
-- ---------------------------------------------------------------------------
--
-- Administrators keep the SELECT policy from 01_schema.sql. Client roles lose
-- the write grants so the trail cannot be edited from the browser.

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.audit_logs FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.audit_logs FROM authenticated;

-- ---------------------------------------------------------------------------
-- 6. Instructor content scope: assigned cohorts only
-- ---------------------------------------------------------------------------
--
-- The previous policy let any Instructor write any cohort's modules and
-- lessons. Administrators remain unrestricted.

DROP POLICY IF EXISTS "academy staff manage modules" ON public.modules;
CREATE POLICY "academy staff manage modules" ON public.modules
  FOR ALL
  USING (
    (public.current_profile_role())::text = 'Administrator'
    OR (
      (public.current_profile_role())::text = 'Instructor'
      AND EXISTS (
        SELECT 1
          FROM public.instructor_cohort_assignments a
         WHERE a.instructor_id = public.current_profile_id()
           AND a.cohort_id = modules.cohort_id
      )
    )
  )
  WITH CHECK (
    (public.current_profile_role())::text = 'Administrator'
    OR (
      (public.current_profile_role())::text = 'Instructor'
      AND EXISTS (
        SELECT 1
          FROM public.instructor_cohort_assignments a
         WHERE a.instructor_id = public.current_profile_id()
           AND a.cohort_id = modules.cohort_id
      )
    )
  );

DROP POLICY IF EXISTS "academy staff manage lessons" ON public.lessons;
CREATE POLICY "academy staff manage lessons" ON public.lessons
  FOR ALL
  USING (
    (public.current_profile_role())::text = 'Administrator'
    OR (
      (public.current_profile_role())::text = 'Instructor'
      AND EXISTS (
        SELECT 1
          FROM public.modules m
          JOIN public.instructor_cohort_assignments a
            ON a.cohort_id = m.cohort_id
         WHERE m.id = lessons.module_id
           AND a.instructor_id = public.current_profile_id()
      )
    )
  )
  WITH CHECK (
    (public.current_profile_role())::text = 'Administrator'
    OR (
      (public.current_profile_role())::text = 'Instructor'
      AND EXISTS (
        SELECT 1
          FROM public.modules m
          JOIN public.instructor_cohort_assignments a
            ON a.cohort_id = m.cohort_id
         WHERE m.id = lessons.module_id
           AND a.instructor_id = public.current_profile_id()
      )
    )
  );

COMMIT;
