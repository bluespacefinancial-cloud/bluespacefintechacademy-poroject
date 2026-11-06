-- Read-only access required for instructor/admin learning monitoring.
-- Run after 003_student_squad_visibility.sql.

DROP POLICY IF EXISTS "staff view enrolments for monitoring" ON public.enrolments;
DROP POLICY IF EXISTS "staff view lesson progress for monitoring" ON public.lesson_progress;

CREATE POLICY "staff view enrolments for monitoring"
  ON public.enrolments FOR SELECT
  USING (public.current_profile_role() IN ('Instructor', 'Administrator'));

CREATE POLICY "staff view lesson progress for monitoring"
  ON public.lesson_progress FOR SELECT
  USING (public.current_profile_role() IN ('Instructor', 'Administrator'));
