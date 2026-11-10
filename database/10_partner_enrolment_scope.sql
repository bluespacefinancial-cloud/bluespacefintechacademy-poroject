-- 10_partner_enrolment_scope.sql
--
-- Apply after 09_media_assets.sql.
--
-- The `students manage partner enrolments` policy originally let every
-- Partner read and write every enrolment row on the platform. That is a
-- cross-partner data exposure: the partner dashboard counted 12 enrolments
-- when the signed-in partner's own course had 6.
--
-- This version keeps the same capabilities, but scopes Partner access to
-- courses owned by the caller's organisation. Students keep their own rows,
-- and Administrators keep platform-wide access.
--
-- Re-runnable: the policy is dropped and recreated.

BEGIN;

DROP POLICY IF EXISTS "students manage partner enrolments" ON public.partner_course_enrolments;

CREATE POLICY "students manage partner enrolments" ON public.partner_course_enrolments
  USING (
    user_id = public.current_profile_id()
    OR (public.current_profile_role())::text = 'Administrator'
    OR (
      (public.current_profile_role())::text = 'Partner'
      AND course_id IN (
        SELECT c.id
        FROM public.partner_courses c
        WHERE c.partner_id = public.current_partner_id()
      )
    )
  )
  WITH CHECK (
    user_id = public.current_profile_id()
    OR (public.current_profile_role())::text = 'Administrator'
    OR (
      (public.current_profile_role())::text = 'Partner'
      AND course_id IN (
        SELECT c.id
        FROM public.partner_courses c
        WHERE c.partner_id = public.current_partner_id()
      )
    )
  );

COMMIT;
