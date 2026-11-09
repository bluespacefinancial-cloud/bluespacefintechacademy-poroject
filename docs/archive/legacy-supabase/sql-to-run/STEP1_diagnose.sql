-- =====================================================================
-- STEP 1 (READ-ONLY): find the object that references a missing relation
-- =====================================================================
-- Run this first. It changes nothing. The identifier is built with chr()
-- so a quote-mangling editor cannot turn it into a real identifier.

-- 1a. Functions whose body mentions the quoted identifier
SELECT n.nspname AS schema,
       p.proname AS function_name,
       left(p.prosrc, 1200) AS body
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.prosrc LIKE '%' || chr(34) || chr(65) || chr(67) || chr(73) || chr(68) || chr(34) || '%'
ORDER BY 1, 2;

-- 1b. Triggers attached to those functions (this is what fires during INSERT)
SELECT n.nspname AS schema,
       c.relname AS table_name,
       t.tgname AS trigger_name,
       pn.nspname AS function_schema,
       p.proname AS function_name
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_proc p ON p.oid = t.tgfoid
JOIN pg_namespace pn ON pn.oid = p.pronamespace
WHERE NOT t.tgisinternal
  AND p.prosrc LIKE '%' || chr(34) || chr(65) || chr(67) || chr(73) || chr(68) || chr(34) || '%'
ORDER BY 1, 2, 3;

-- 1c. Sanity: the 016 target relations must be real tables (relkind = r)
SELECT c.relname,
       c.relkind,
       CASE c.relkind
         WHEN 'r' THEN 'table'
         WHEN 'p' THEN 'partitioned table'
         WHEN 'v' THEN 'view'
         WHEN 'm' THEN 'materialized view'
         ELSE c.relkind::text
       END AS kind
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN (
    'users','cohorts','squads','enrolments','partners','partner_courses',
    'partner_course_lessons','modules','lessons','labs','live_classes',
    'clinics','announcements','notifications'
  )
ORDER BY 1;
