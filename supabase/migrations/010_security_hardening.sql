-- BlueSPACE LMS — Production security hardening
-- Requires supabase/schema.sql and migrations 001-009 to be applied first.
--
-- Fixes:
--   1. cohorts, labs and assessments were created with RLS DISABLED in
--      schema.sql and no later migration enabled it, so they were reachable
--      directly through the public anon key shipped in the browser bundle.
--   2. labs.solution_code was readable by students.
--   3. assessment_questions.correct_answer was readable by students.
--
-- RLS is row-level, so the two secret columns are hidden with column-level
-- grants: table-level SELECT is revoked from the client roles and re-granted
-- without the secret column. The service role keeps full access.
--
-- This migration is idempotent and safe to re-run.

BEGIN;

-- =====================================================================
-- Auth helpers: treat deactivated accounts as unauthenticated
-- =====================================================================
-- is_active is enforced here instead of in every policy, so all existing RLS
-- policies that call these helpers fail closed for deactivated accounts.
CREATE OR REPLACE FUNCTION public.current_profile_id()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.users
  WHERE lower(email) = lower(auth.email())
    AND is_active = 1
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_profile_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT type FROM public.users
  WHERE lower(email) = lower(auth.email())
    AND is_active = 1
  LIMIT 1;
$$;

-- =====================================================================
-- users: stop self-service privilege escalation
-- =====================================================================
-- The "users update own profile" policy checks the row, not the columns, so a
-- Student could UPDATE their own type to 'Administrator'. No client code
-- updates users directly, so restrict updates to non-privileged columns.
-- Role and activation changes must go through the service role / SQL.
REVOKE UPDATE ON public.users FROM anon, authenticated;
GRANT UPDATE (name, avatar, phone) ON public.users TO authenticated;

-- Clear the forced-reset flag after the user sets a new password. Runs as the
-- definer so it can touch force_password_change without granting that column.
CREATE OR REPLACE FUNCTION public.clear_my_force_password_change()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.users
  SET force_password_change = 0, updated_at = now()
  WHERE id = public.current_profile_id();
$$;

REVOKE ALL ON FUNCTION public.clear_my_force_password_change() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.clear_my_force_password_change() TO authenticated;

-- =====================================================================
-- cohorts
-- =====================================================================
ALTER TABLE public.cohorts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff manage cohorts" ON public.cohorts;
DROP POLICY IF EXISTS "students view enrolled cohorts" ON public.cohorts;

CREATE POLICY "staff manage cohorts"
  ON public.cohorts FOR ALL
  USING (public.current_profile_role() IN ('Instructor', 'Administrator'))
  WITH CHECK (public.current_profile_role() IN ('Instructor', 'Administrator'));

CREATE POLICY "students view enrolled cohorts"
  ON public.cohorts FOR SELECT
  USING (EXISTS (
    SELECT 1
    FROM public.enrolments e
    WHERE e.user_id = public.current_profile_id()
      AND e.cohort_id = cohorts.id
      AND e.status IN ('enrolled', 'active', 'completed')
  ));

-- =====================================================================
-- labs
-- =====================================================================
ALTER TABLE public.labs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff manage labs" ON public.labs;
DROP POLICY IF EXISTS "students view labs for visible modules" ON public.labs;

CREATE POLICY "staff manage labs"
  ON public.labs FOR ALL
  USING (public.current_profile_role() IN ('Instructor', 'Administrator'))
  WITH CHECK (public.current_profile_role() IN ('Instructor', 'Administrator'));

CREATE POLICY "students view labs for visible modules"
  ON public.labs FOR SELECT
  USING (EXISTS (
    SELECT 1
    FROM public.lessons l
    JOIN public.modules m ON m.id = l.module_id
    JOIN public.enrolments e ON e.cohort_id = m.cohort_id
    WHERE l.id = labs.lesson_id
      AND e.user_id = public.current_profile_id()
      AND e.status IN ('enrolled', 'active', 'completed')
  ));

-- Hide solution_code from client roles. No client code reads it today; staff
-- tooling should use the service role if the solution ever needs to be shown.
REVOKE SELECT ON public.labs FROM anon, authenticated;
GRANT SELECT (
  id, lesson_id, title, instructions, starter_code, due_date,
  max_score, track_specific, created_by, created_at, updated_at
) ON public.labs TO authenticated;

-- =====================================================================
-- assessments
-- =====================================================================
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff manage assessments" ON public.assessments;
DROP POLICY IF EXISTS "students view published assessments" ON public.assessments;

CREATE POLICY "staff manage assessments"
  ON public.assessments FOR ALL
  USING (public.current_profile_role() IN ('Instructor', 'Administrator'))
  WITH CHECK (public.current_profile_role() IN ('Instructor', 'Administrator'));

CREATE POLICY "students view published assessments"
  ON public.assessments FOR SELECT
  USING (
    is_published
    AND EXISTS (
      SELECT 1
      FROM public.modules m
      JOIN public.enrolments e ON e.cohort_id = m.cohort_id
      WHERE m.id = assessments.module_id
        AND e.user_id = public.current_profile_id()
        AND e.status IN ('enrolled', 'active', 'completed')
    )
  );

-- =====================================================================
-- assessment_questions: hide the answer key
-- =====================================================================
-- Only exists once migration 006 has run.
DO $$
BEGIN
  IF to_regclass('public.assessment_questions') IS NOT NULL THEN
    EXECUTE 'REVOKE SELECT ON public.assessment_questions FROM anon, authenticated';
    EXECUTE 'GRANT SELECT (id, assessment_id, prompt, question_type, options, points, order_index, created_at, updated_at) ON public.assessment_questions TO authenticated';
  END IF;
END $$;

COMMIT;

-- Ask PostgREST to pick up the new grants immediately.
NOTIFY pgrst, 'reload schema';
