-- 08_column_grants.sql
--
-- Apply after 07_audit_spine.sql.
--
-- Why this exists
-- ---------------
-- `00_bootstrap.sql` sets ALTER DEFAULT PRIVILEGES ... GRANT ALL ON TABLES TO
-- anon, authenticated, service_role. Every table created afterwards therefore
-- starts with full table privileges, even when `01_schema.sql` then grants only
-- selected columns. A table-level grant subsumes column-level grants, so the
-- "password / solution_code / correct_answer are not selectable" rule in
-- `01_schema.sql` was never actually enforced on a live database.
--
-- The practical impact was a privilege escalation: any signed-in user could
-- PATCH their own `users` row (the "users update own profile" policy allows the
-- row) and rewrite `type`, `email`, `is_active` or `password` through the data
-- API. This migration closes that by re-granting column by column.
--
-- Roles:
--   * anon / authenticated  - browser sessions. Column grants below.
--   * service_role          - Laravel internals, unchanged.
--   * lms_service           - Laravel's login, member of service_role, unaffected.
--
-- Re-runnable: every statement is REVOKE/GRANT, no data changes.

BEGIN;

-- ---------------------------------------------------------------- users -----
-- `password` is never readable or writable by a browser session. Authentication
-- is Laravel's job (lms_service). `auth_user_id` is likewise server-owned.
REVOKE ALL ON TABLE public.users FROM anon, authenticated;

GRANT SELECT (
  id, name, email, type, avatar, phone, is_active, force_password_change,
  last_login_at, partner_id, student_id, created_at, updated_at, auth_user_id
) ON TABLE public.users TO authenticated;

-- Self-service profile fields. Privilege-bearing columns are writable so the
-- administrator policy can use them, but `guard_user_privileges` rejects any
-- non-administrator change to them.
GRANT UPDATE (
  name, avatar, phone, email, type, is_active, partner_id, student_id,
  force_password_change
) ON TABLE public.users TO authenticated;

GRANT INSERT (
  name, email, type, avatar, phone, is_active, partner_id, student_id,
  force_password_change
) ON TABLE public.users TO authenticated;

GRANT DELETE ON TABLE public.users TO authenticated;

-- ---------------------------------------------------------------- labs ------
-- Students must not read `solution_code`; instructors author without it. The
-- column is still writable for staff through the table-level UPDATE/DELETE
-- grants, which only carry the privileges PostgREST needs for staff edits.
REVOKE ALL ON TABLE public.labs FROM anon, authenticated;

GRANT SELECT (
  id, lesson_id, title, instructions, starter_code, due_date, max_score,
  track_specific, created_by, created_at, updated_at
) ON TABLE public.labs TO authenticated;

GRANT INSERT, UPDATE, DELETE ON TABLE public.labs TO authenticated;

-- --------------------------------------------------- assessment_questions ----
-- `correct_answer` is write-only for the browser: staff author questions and
-- the server grades them. Students must never be able to read it.
REVOKE ALL ON TABLE public.assessment_questions FROM anon, authenticated;

GRANT SELECT (
  id, assessment_id, prompt, question_type, options, points, order_index,
  created_at, updated_at
) ON TABLE public.assessment_questions TO authenticated;

GRANT INSERT, UPDATE, DELETE ON TABLE public.assessment_questions TO authenticated;

COMMIT;
