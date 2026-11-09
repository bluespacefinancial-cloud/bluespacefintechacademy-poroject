-- =====================================================================
-- STEP 3 - READ ONLY DIAGNOSTIC
-- =====================================================================
-- Run the whole file in the Supabase SQL Editor.
-- It changes nothing. It returns one table with sections A to G.
-- Copy every row of the result back.
--
-- What each section tells us:
--   A  do the demo rows actually exist in the database
--   B  is row level security enabled or forced on those tables
--   C  the real cohort names and ids
--   D  the real module rows, their cohort and published flag
--   E  who is enrolled in what
--   F  every Supabase Auth account and its matching profile row
--   G  every policy that can hide or reveal those tables

WITH counts AS (
  SELECT 'cohorts' AS item, count(*)::text AS value FROM public.cohorts
  UNION ALL SELECT 'cohorts named Cohort 1 - December 2026', count(*)::text FROM public.cohorts WHERE name = 'Cohort 1 - December 2026'
  UNION ALL SELECT 'squads', count(*)::text FROM public.squads
  UNION ALL SELECT 'enrolments', count(*)::text FROM public.enrolments
  UNION ALL SELECT 'enrolments enrolled or active', count(*)::text FROM public.enrolments WHERE status IN ('enrolled', 'active')
  UNION ALL SELECT 'users', count(*)::text FROM public.users
  UNION ALL SELECT 'modules', count(*)::text FROM public.modules
  UNION ALL SELECT 'modules published', count(*)::text FROM public.modules WHERE is_published
  UNION ALL SELECT 'lessons', count(*)::text FROM public.lessons
  UNION ALL SELECT 'labs', count(*)::text FROM public.labs
  UNION ALL SELECT 'live_classes', count(*)::text FROM public.live_classes
  UNION ALL SELECT 'clinics', count(*)::text FROM public.clinics
  UNION ALL SELECT 'announcements', count(*)::text FROM public.announcements
  UNION ALL SELECT 'notifications', count(*)::text FROM public.notifications
  UNION ALL SELECT 'partners', count(*)::text FROM public.partners
  UNION ALL SELECT 'partner_courses', count(*)::text FROM public.partner_courses
  UNION ALL SELECT 'partner_course_lessons', count(*)::text FROM public.partner_course_lessons
  UNION ALL SELECT 'auth users', count(*)::text FROM auth.users
)
SELECT 'A counts' AS section, item, value FROM counts

UNION ALL

SELECT 'B rls',
       c.relname,
       'enabled=' || c.relrowsecurity::text || ' forced=' || c.relforcerowsecurity::text
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN (
    'cohorts', 'enrolments', 'modules', 'lessons', 'labs', 'users',
    'live_classes', 'clinics', 'announcements', 'notifications',
    'partner_courses', 'partner_course_lessons', 'squads'
  )

UNION ALL

SELECT 'C cohort',
       name,
       'id=' || id::text
         || ' status=' || coalesce(status, 'NULL')
         || ' start=' || coalesce(start_date::text, 'NULL')
         || ' capacity=' || coalesce(capacity::text, 'NULL')
FROM public.cohorts

UNION ALL

SELECT 'D module',
       title,
       'id=' || id::text
         || ' cohort=' || coalesce(cohort_id::text, 'NULL')
         || ' published=' || coalesce(is_published::text, 'NULL')
         || ' stage=' || coalesce(stage, 'NULL')
FROM public.modules

UNION ALL

SELECT 'E enrolment',
       coalesce(u.email, 'user id ' || e.user_id::text),
       'cohort=' || coalesce(c.name, 'NULL')
         || ' status=' || coalesce(e.status, 'NULL')
         || ' track=' || coalesce(e.track, 'NULL')
         || ' squad=' || coalesce(e.squad_id::text, 'NULL')
FROM public.enrolments e
LEFT JOIN public.users u ON u.id = e.user_id
LEFT JOIN public.cohorts c ON c.id = e.cohort_id

UNION ALL

SELECT 'F auth user',
       coalesce(au.email, 'no email'),
       CASE
         WHEN pu.id IS NULL THEN 'NO matching public.users row'
         ELSE 'profile=' || pu.id::text
           || ' type=' || coalesce(pu.type, 'NULL')
           || ' active=' || coalesce(pu.is_active::text, 'NULL')
           || ' auth_user_id=' || coalesce(pu.auth_user_id::text, 'NULL')
       END
         || ' confirmed=' || coalesce(to_jsonb(au)->>'email_confirmed_at', 'NULL')
         || ' last_sign_in=' || coalesce(to_jsonb(au)->>'last_sign_in_at', 'NULL')
FROM auth.users au
LEFT JOIN public.users pu ON lower(pu.email) = lower(au.email)

UNION ALL

SELECT 'G policy',
       p.tablename || '.' || p.policyname,
       p.cmd || ' ' || p.permissive || ' ' || coalesce(left(p.qual, 300), '')
FROM pg_policies p
WHERE p.schemaname = 'public'
  AND p.tablename IN (
    'cohorts', 'enrolments', 'modules', 'lessons', 'labs', 'users',
    'live_classes', 'clinics', 'announcements', 'notifications',
    'partner_courses', 'partner_course_lessons', 'squads'
  )

ORDER BY 1, 2;
