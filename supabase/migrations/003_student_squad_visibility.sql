-- Allow students to see the minimum identity data needed for their own squad.
-- Run after 002_academy_operations.sql.

DROP POLICY IF EXISTS "students view squad profiles" ON public.users;
DROP POLICY IF EXISTS "students view squad enrolments" ON public.enrolments;

CREATE POLICY "students view squad profiles"
  ON public.users FOR SELECT
  USING (
    id = public.current_profile_id()
    OR public.current_profile_role() IN ('Instructor', 'Administrator')
    OR EXISTS (
      SELECT 1
      FROM public.enrolments own_enrolment
      JOIN public.enrolments squad_enrolment
        ON squad_enrolment.squad_id = own_enrolment.squad_id
      WHERE own_enrolment.user_id = public.current_profile_id()
        AND own_enrolment.squad_id IS NOT NULL
        AND squad_enrolment.user_id = users.id
    )
  );

CREATE POLICY "students view squad enrolments"
  ON public.enrolments FOR SELECT
  USING (
    user_id = public.current_profile_id()
    OR public.current_profile_role() IN ('Instructor', 'Administrator')
    OR EXISTS (
      SELECT 1
      FROM public.enrolments own_enrolment
      WHERE own_enrolment.user_id = public.current_profile_id()
        AND own_enrolment.squad_id IS NOT NULL
        AND own_enrolment.squad_id = enrolments.squad_id
    )
  );
