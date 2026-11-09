-- =====================================================================
-- STEP 4 - LINK YOUR OWN LOGIN TO THE DEMO COHORT
-- =====================================================================
-- Use this only if you want to sign in with your own email instead of the
-- demo student account.
--
-- Before running:
--   1. Create the auth user for your email in the Supabase dashboard:
--      Authentication -> Users -> Add user -> Create new user
--      (tick Auto Confirm User)
--   2. Change the value of v_email below to that exact email.
--   3. Run this whole file in the SQL Editor.
--
-- It is safe to run more than once.

DO $$
DECLARE
  v_email  text := 'REPLACE_WITH_YOUR_LOGIN_EMAIL';
  v_uid    uuid;
  v_pid    bigint;
  v_cohort bigint;
  v_squad  bigint;
BEGIN
  IF lower(v_email) = 'replace_with_your_login_email' THEN
    RAISE EXCEPTION 'Edit v_email at the top of this script to your login email first';
  END IF;

  SELECT id INTO v_uid
  FROM auth.users
  WHERE lower(email) = lower(v_email)
  LIMIT 1;

  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'No Supabase Auth user found for %. Create it in Authentication then Users first.', v_email;
  END IF;

  SELECT id INTO v_pid
  FROM public.users
  WHERE lower(email) = lower(v_email)
  LIMIT 1;

  IF v_pid IS NULL THEN
    INSERT INTO public.users (name, email, type, is_active, auth_user_id)
    VALUES (v_email, v_email, 'Student', 1, v_uid)
    RETURNING id INTO v_pid;
  ELSE
    UPDATE public.users
    SET auth_user_id = v_uid,
        is_active = 1
    WHERE id = v_pid;
  END IF;

  SELECT id INTO v_cohort
  FROM public.cohorts
  WHERE name = 'Cohort 1 - December 2026'
  LIMIT 1;

  IF v_cohort IS NULL THEN
    RAISE EXCEPTION 'Cohort 1 - December 2026 not found. Run STEP2_APPLY_DEMO_DATA.sql first.';
  END IF;

  SELECT id INTO v_squad
  FROM public.squads
  WHERE cohort_id = v_cohort
  ORDER BY id
  LIMIT 1;

  IF NOT EXISTS (
    SELECT 1
    FROM public.enrolments
    WHERE cohort_id = v_cohort
      AND user_id = v_pid
  ) THEN
    INSERT INTO public.enrolments (cohort_id, user_id, squad_id, track, status)
    VALUES (v_cohort, v_pid, v_squad, 'Finsoft', 'active');
  END IF;

  RAISE NOTICE 'Linked % to profile % in cohort % (squad %)', v_email, v_pid, v_cohort, v_squad;
END $$;
