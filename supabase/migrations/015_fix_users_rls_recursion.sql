-- BlueSPACE LMS — Fix "stack depth limit exceeded" (54001) on public.users
-- Run after 001-014. Idempotent and safe to re-run.
--
-- Symptom: every PostgREST read of public.users returns HTTP 500 with
--   {"code":"54001","message":"stack depth limit exceeded"}
-- so loadProfile() in AuthContext gets no profile and the student is signed
-- straight back out.
--
-- Cause: a SELECT policy on public.users calls a helper that reads
-- public.users again *with* RLS applied, which re-evaluates the policy, which
-- calls the helper... Postgres only detects direct policy self-reference
-- (42P17); recursion hidden behind a function shows up as 54001 instead.
-- This happens when a users policy was added outside the migrations (e.g. in
-- the dashboard) using a SECURITY INVOKER helper or a direct sub-select, or
-- when the helpers lost SECURITY DEFINER / their owner.
--
-- To see what is live before running this:
--   SELECT policyname, cmd, qual FROM pg_policies
--   WHERE schemaname = 'public' AND tablename = 'users';
--   SELECT p.proname, p.prosecdef, pg_get_userbyid(p.proowner)
--   FROM pg_proc p WHERE p.pronamespace = 'public'::regnamespace
--     AND p.proname LIKE 'current_%';
--
-- Fix:
--   1. Recreate the identity helpers as SECURITY DEFINER owned by postgres,
--      so their reads of public.users bypass RLS.
--   2. Drop every policy on public.users (including any created outside the
--      migrations) and recreate a self-contained set that only calls those
--      helpers, so the policy can never re-enter itself or bounce through
--      enrolments RLS.
--   3. Add the student_id column the client selects, and include it (and
--      partner_id, used by Partner Management) in the column-level grant from
--      010. Without this, the profile query fails with 42501 the moment the
--      recursion is gone.

BEGIN;

-- ---------------------------------------------------------------------
-- 1. Columns the client reads
-- ---------------------------------------------------------------------
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS auth_user_id uuid UNIQUE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS student_id varchar(50) DEFAULT NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS partner_id bigint DEFAULT NULL;

-- Table owner must not be subject to its own policies, otherwise the
-- SECURITY DEFINER helpers below still go through RLS.
ALTER TABLE public.users NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public.enrolments NO FORCE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------
-- 2. Identity helpers (RLS-bypassing)
-- ---------------------------------------------------------------------
-- The live helpers may have been created with a different return type than
-- the migrations (e.g. varchar instead of text). CREATE OR REPLACE cannot
-- change a return type (42P13), and DROP would cascade through nearly every
-- policy in the app. So each helper is redefined with whatever return type it
-- already has, falling back to the migration default when it does not exist.
DO $do$
DECLARE
  ret text;
  elem text;
BEGIN
  -- current_profile_id()
  SELECT pg_get_function_result(p.oid) INTO ret
  FROM pg_proc p
  WHERE p.pronamespace = 'public'::regnamespace
    AND p.proname = 'current_profile_id' AND p.pronargs = 0;
  ret := coalesce(ret, 'bigint');
  EXECUTE format($f$
    CREATE OR REPLACE FUNCTION public.current_profile_id()
    RETURNS %1$s
    LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
    AS $body$
      SELECT id::%1$s FROM public.users
      WHERE is_active = 1
        AND (
          auth_user_id = auth.uid()
          OR (auth_user_id IS NULL AND lower(email) = lower(auth.email()))
        )
      LIMIT 1;
    $body$;
  $f$, ret);

  -- current_profile_role()
  ret := NULL;
  SELECT pg_get_function_result(p.oid) INTO ret
  FROM pg_proc p
  WHERE p.pronamespace = 'public'::regnamespace
    AND p.proname = 'current_profile_role' AND p.pronargs = 0;
  ret := coalesce(ret, 'text');
  EXECUTE format($f$
    CREATE OR REPLACE FUNCTION public.current_profile_role()
    RETURNS %1$s
    LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
    AS $body$
      SELECT type::%1$s FROM public.users
      WHERE is_active = 1
        AND (
          auth_user_id = auth.uid()
          OR (auth_user_id IS NULL AND lower(email) = lower(auth.email()))
        )
      LIMIT 1;
    $body$;
  $f$, ret);

  -- current_squad_ids()
  ret := NULL;
  SELECT pg_get_function_result(p.oid) INTO ret
  FROM pg_proc p
  WHERE p.pronamespace = 'public'::regnamespace
    AND p.proname = 'current_squad_ids' AND p.pronargs = 0;
  ret := coalesce(ret, 'SETOF bigint');
  elem := regexp_replace(ret, '^SETOF\s+', '', 'i');
  EXECUTE format($f$
    CREATE OR REPLACE FUNCTION public.current_squad_ids()
    RETURNS %1$s
    LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
    AS $body$
      SELECT squad_id::%2$s
      FROM public.enrolments
      WHERE user_id = public.current_profile_id()
        AND squad_id IS NOT NULL;
    $body$;
  $f$, ret, elem);
END
$do$;

-- User ids that share a squad with the caller. Reading enrolments here as the
-- definer keeps the users policy independent of enrolments policies, so a
-- policy on enrolments that reads users can never close a loop.
CREATE OR REPLACE FUNCTION public.current_squad_member_ids()
RETURNS SETOF bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT e.user_id
  FROM public.enrolments e
  WHERE e.squad_id IN (SELECT public.current_squad_ids());
$$;

ALTER FUNCTION public.current_profile_id() OWNER TO postgres;
ALTER FUNCTION public.current_profile_role() OWNER TO postgres;
ALTER FUNCTION public.current_squad_ids() OWNER TO postgres;
ALTER FUNCTION public.current_squad_member_ids() OWNER TO postgres;

-- Policies are evaluated for anon requests too; with no session the helpers
-- return NULL / empty, so the policy is simply false.
GRANT EXECUTE ON FUNCTION public.current_profile_id() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.current_profile_role() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.current_squad_ids() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.current_squad_member_ids() TO anon, authenticated;

-- ---------------------------------------------------------------------
-- 3. Replace every policy on public.users
-- ---------------------------------------------------------------------
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'users'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.users', pol.policyname);
  END LOOP;
END
$$;

-- Own row stays readable even when deactivated (via auth.email()), so the
-- login screen can tell "deactivated" from "not provisioned" (see 010).
CREATE POLICY "users view own profile or staff view profiles"
  ON public.users FOR SELECT
  USING (
    auth_user_id = auth.uid()
    OR lower(email) = lower(auth.email())
    OR public.current_profile_role() IN ('Instructor', 'Administrator')
  );

CREATE POLICY "students view squad profiles"
  ON public.users FOR SELECT
  USING (id IN (SELECT public.current_squad_member_ids()));

CREATE POLICY "users update own profile"
  ON public.users FOR UPDATE
  USING (id = public.current_profile_id())
  WITH CHECK (id = public.current_profile_id());

-- ---------------------------------------------------------------------
-- 4. Column-level grants (010 + student_id, partner_id)
-- ---------------------------------------------------------------------
REVOKE SELECT ON public.users FROM anon, authenticated;
GRANT SELECT (
  id, name, email, type, avatar, phone, is_active,
  force_password_change, last_login_at, created_at, updated_at,
  student_id, partner_id
) ON public.users TO authenticated;

REVOKE UPDATE ON public.users FROM anon, authenticated;
GRANT UPDATE (name, avatar, phone) ON public.users TO authenticated;

COMMIT;

-- Make PostgREST pick up the new column/grants immediately.
NOTIFY pgrst, 'reload schema';
