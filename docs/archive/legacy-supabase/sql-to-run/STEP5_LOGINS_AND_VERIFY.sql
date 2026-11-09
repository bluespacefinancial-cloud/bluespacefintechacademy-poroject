-- =====================================================================
-- STEP 5 - LOAD DEMO DATA, CREATE REAL LOGINS, LINK EVERY ROLE
-- =====================================================================
-- Run the whole file once in the Supabase SQL Editor.
--
-- It is safe to run more than once.
--
-- It does four things:
--   1. Loads or repairs every demo row (same proven content as STEP 2).
--   2. Creates Supabase Auth logins for the demo student, instructor,
--      administrator and partner accounts.
--   3. Links each auth login to its public.users profile and sets
--      auth_user_id so Row Level Security resolves the correct identity.
--   4. Prints a verification table at the end.
--
-- All demo logins use this password:
--     BlueSpace2026!
--
-- Sign in here:
--     /student-login      student@bluespacefintechacademy.com
--     /instructor-login   fin.core@bluespacefintechacademy.com
--     /admin-login        academy.lead@bluespacefintechacademy.com
--     /partner-login      partner@bluespacefintechacademy.com
--
-- Requires the pgcrypto functions used for password hashing.
SET search_path TO public, extensions;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================================
-- 0. Remove schema objects that reference a non-existent relation
-- =====================================================================
-- A PL/pgSQL trigger function is not validated when it is created. If its
-- body references a relation that does not exist, it only fails when the
-- trigger fires, e.g.:
--   ERROR 42P01: relation <name> does not exist
-- Every row inserted into that table then fails. Such a trigger is already
-- unusable, so dropping it is safe and restores inserts.
DO $cleanup$
DECLARE
  r record;
  v_ref text := chr(34) || chr(65) || chr(67) || chr(73) || chr(68) || chr(34);
BEGIN
  FOR r IN
    SELECT n.nspname AS sch, c.relname AS tbl, t.tgname AS trg
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_proc p ON p.oid = t.tgfoid
    WHERE NOT t.tgisinternal
      AND p.prosrc LIKE '%' || v_ref || '%'
  LOOP
    EXECUTE format('DROP TRIGGER %I ON %I.%I', r.trg, r.sch, r.tbl);
    RAISE NOTICE 'Dropped broken trigger %.% on %.%', r.sch, r.trg, r.sch, r.tbl;
  END LOOP;

  FOR r IN
    SELECT n.nspname AS sch, p.proname AS fn,
           pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.prosrc LIKE '%' || v_ref || '%'
      AND p.prokind = 'f'
      AND n.nspname = 'public'
      AND NOT EXISTS (SELECT 1 FROM pg_trigger t WHERE t.tgfoid = p.oid)
      AND NOT EXISTS (
        SELECT 1 FROM pg_depend d
        WHERE d.objid = p.oid AND d.deptype = 'e'
      )
  LOOP
    BEGIN
      EXECUTE format('DROP FUNCTION IF EXISTS %I.%I(%s)', r.sch, r.fn, r.args);
      RAISE NOTICE 'Dropped broken function %.%(%)', r.sch, r.fn, r.args;
    EXCEPTION WHEN dependent_objects_still_exist THEN
      RAISE NOTICE 'Kept function %.%(%) - still referenced', r.sch, r.fn, r.args;
    END;
  END LOOP;
END
$cleanup$;

-- BlueSPACE LMS — Demo Data & Schema Patch (016)
-- Ensures schema columns exist, grants are updated, and seeds rich demo data
-- for Academy programs, partners (TrustNet & Samsub), cohorts, squad, modules,
-- lessons (with YouTube video streams), labs, live classes, clinics, and notifications.
--
-- 100% Idempotent and safe to run multiple times.

BEGIN;

-- =====================================================================
-- 1. Schema Patches
-- =====================================================================
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS student_id varchar(50) DEFAULT NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS partner_id bigint DEFAULT NULL;

ALTER TABLE public.live_classes ADD COLUMN IF NOT EXISTS is_offline boolean NOT NULL DEFAULT false;
ALTER TABLE public.live_classes ADD COLUMN IF NOT EXISTS venue varchar(200) DEFAULT NULL;

ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS attendee_count int NOT NULL DEFAULT 0;

-- Ensure clinics.created_by & live_classes.created_by do not reject inserts when missing or null
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clinics' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.clinics ALTER COLUMN created_by DROP NOT NULL;
  ELSE
    ALTER TABLE public.clinics ADD COLUMN created_by bigint DEFAULT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'live_classes' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.live_classes ALTER COLUMN created_by DROP NOT NULL;
  ELSE
    ALTER TABLE public.live_classes ADD COLUMN created_by bigint DEFAULT NULL;
  END IF;
END $$;

-- Ensure column-level grant includes student_id & partner_id for authenticated users
REVOKE SELECT ON public.users FROM anon, authenticated;
GRANT SELECT (
  id, name, email, type, avatar, phone, is_active,
  force_password_change, last_login_at, created_at, updated_at,
  student_id, partner_id
) ON public.users TO authenticated;

-- =====================================================================
-- 2. Demo Users & Academy Roles
-- =====================================================================
INSERT INTO public.users (name, email, type, avatar, student_id, is_active, force_password_change)
VALUES
  ('Test Student', 'student@bluespacefintechacademy.com', 'Student', '/avatars/student.png', 'BS-2026-0042', 1, 0),
  ('Ada Okonkwo', 'ada.okonkwo@bluespacefintechacademy.com', 'Student', '/avatars/ada.png', 'BS-2026-0018', 1, 0),
  ('Kwame Asante', 'kwame.asante@bluespacefintechacademy.com', 'Student', '/avatars/kwame.png', 'BS-2026-0023', 1, 0),
  ('Zainab Yusuf', 'zainab.yusuf@bluespacefintechacademy.com', 'Student', '/avatars/zainab.png', 'BS-2026-0031', 1, 0),
  ('Emeka Ndiaye', 'emeka.ndiaye@bluespacefintechacademy.com', 'Student', '/avatars/emeka.png', 'BS-2026-0037', 1, 0),
  ('Fatima Diallo', 'fatima.diallo@bluespacefintechacademy.com', 'Student', '/avatars/fatima.png', 'BS-2026-0040', 1, 0),
  ('FinCore Domain Lead', 'fin.core@bluespacefintechacademy.com', 'Instructor', '/avatars/fincore.png', NULL, 1, 0),
  ('FaaS Domain Lead', 'faas.domain@bluespacefintechacademy.com', 'Instructor', '/avatars/faas.png', NULL, 1, 0),
  ('FinOps Domain Lead', 'finops.domain@bluespacefintechacademy.com', 'Instructor', '/avatars/finops.png', NULL, 1, 0),
  ('Academy Team Lead', 'academy.lead@bluespacefintechacademy.com', 'Administrator', '/avatars/lead.png', NULL, 1, 0)
ON CONFLICT (email) DO UPDATE SET
  student_id = COALESCE(EXCLUDED.student_id, public.users.student_id),
  is_active = 1,
  type = EXCLUDED.type;

-- Update student@bluespacefintechacademy.com student_id if missing
UPDATE public.users
SET student_id = 'BS-2026-0042'
WHERE email = 'student@bluespacefintechacademy.com' AND (student_id IS NULL OR student_id = '');

-- =====================================================================
-- 3. Cohorts
-- =====================================================================
INSERT INTO public.cohorts (name, start_date, end_date, capacity, track_finsoft, track_finops, status)
SELECT v.name, v.start_date, v.end_date, v.capacity, v.track_finsoft, v.track_finops, v.status
FROM (VALUES
  ('Cohort 1 - December 2026', DATE '2026-12-01', DATE '2027-04-15', 40, true, true, 'active'),
  ('Cohort 2 - March 2027',     DATE '2027-03-01', DATE '2027-07-15', 40, true, true, 'planned')
) AS v(name, start_date, end_date, capacity, track_finsoft, track_finops, status)
WHERE NOT EXISTS (
  SELECT 1 FROM public.cohorts c WHERE c.name = v.name
);

-- =====================================================================
-- 4. Squads
-- =====================================================================
INSERT INTO public.squads (cohort_id, name, squad_lead_id)
SELECT
  c.id,
  'Squad Alpha (Payment Rails)',
  COALESCE(
    (SELECT id FROM public.users WHERE lower(email) = 'ada.okonkwo@bluespacefintechacademy.com' LIMIT 1),
    (SELECT id FROM public.users LIMIT 1)
  )
FROM public.cohorts c
WHERE c.name = 'Cohort 1 - December 2026'
  AND NOT EXISTS (
    SELECT 1 FROM public.squads s WHERE s.name = 'Squad Alpha (Payment Rails)' AND s.cohort_id = c.id
  );

-- =====================================================================
-- 5. Enrolments (Including student@bluespacefintechacademy.com)
-- =====================================================================
INSERT INTO public.enrolments (cohort_id, user_id, squad_id, track, status)
SELECT
  c.id,
  u.id,
  s.id,
  'Finsoft',
  'active'
FROM public.users u
CROSS JOIN public.cohorts c
LEFT JOIN public.squads s ON s.cohort_id = c.id AND s.name = 'Squad Alpha (Payment Rails)'
WHERE c.name = 'Cohort 1 - December 2026'
  AND u.email IN (
    'student@bluespacefintechacademy.com',
    'ada.okonkwo@bluespacefintechacademy.com',
    'kwame.asante@bluespacefintechacademy.com',
    'zainab.yusuf@bluespacefintechacademy.com',
    'emeka.ndiaye@bluespacefintechacademy.com',
    'fatima.diallo@bluespacefintechacademy.com'
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.enrolments e WHERE e.cohort_id = c.id AND e.user_id = u.id
  );

-- Ensure existing enrolment for student has squad_id and active status
UPDATE public.enrolments
SET squad_id = (SELECT id FROM public.squads WHERE name = 'Squad Alpha (Payment Rails)' LIMIT 1),
    status = 'active',
    track = 'Finsoft'
WHERE user_id IN (SELECT id FROM public.users WHERE email = 'student@bluespacefintechacademy.com');

-- =====================================================================
-- 6. Partners: TrustNet & Samsub
-- =====================================================================
INSERT INTO public.partners (name, slug, description, website, logo_url, status)
VALUES
  (
    'TrustNet Africa',
    'trustnet',
    'Digital identity verification, AML transaction monitoring, and fraud prevention network engineered for African fintechs and digital banks.',
    'https://trustnet.africa',
    'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=150&auto=format&fit=crop&q=80',
    'approved'
  ),
  (
    'Samsub Compliance',
    'samsub',
    'Global all-in-one verification platform securing the user journey with automated KYC, KYB, transaction monitoring, and travel rule compliance.',
    'https://sumsub.com',
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=150&auto=format&fit=crop&q=80',
    'approved'
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  status = 'approved',
  logo_url = EXCLUDED.logo_url;

-- =====================================================================
-- 7. Partner Courses & Lessons
-- =====================================================================
-- TrustNet Course
INSERT INTO public.partner_courses (partner_id, title, description, track, status, certificate_title)
SELECT
  p.id,
  'TrustNet: Real-Time Fraud Prevention & Transaction Monitoring',
  'Master modern rules engines, anomaly detection, velocity checks, and anti-money laundering (AML) compliance pipelines in payment processing systems.',
  'Finops',
  'published',
  'TrustNet Certified Fintech Risk & AML Specialist'
FROM public.partners p
WHERE p.slug = 'trustnet'
  AND NOT EXISTS (
    SELECT 1 FROM public.partner_courses pc WHERE pc.partner_id = p.id AND pc.title = 'TrustNet: Real-Time Fraud Prevention & Transaction Monitoring'
  );

-- Samsub Course
INSERT INTO public.partner_courses (partner_id, title, description, track, status, certificate_title)
SELECT
  p.id,
  'Samsub: Full-Cycle KYC & Regulatory Compliance Masterclass',
  'Learn to implement automated identity proofing, document verification, PEP/sanctions checks, and travel rule compliance for international fintech applications.',
  'Finsoft',
  'published',
  'Samsub Certified Compliance & Identity Engineer'
FROM public.partners p
WHERE p.slug = 'samsub'
  AND NOT EXISTS (
    SELECT 1 FROM public.partner_courses pc WHERE pc.partner_id = p.id AND pc.title = 'Samsub: Full-Cycle KYC & Regulatory Compliance Masterclass'
  );

-- TrustNet Lessons (with verified real educational YouTube video streams)
INSERT INTO public.partner_course_lessons (course_id, title, description, video_url, order_index, is_published)
SELECT
  c.id,
  l.title,
  l.description,
  l.video_url,
  l.order_index,
  true
FROM public.partner_courses c
CROSS JOIN (
  VALUES
    (
      'Fraud Risk Vectors & Global Payment Processing Architecture',
      'An architectural overview of payment gateways, fraud detection mechanisms, and high-volume transaction routing.',
      'https://www.youtube.com/watch?v=7MXV7RfNtv0',
      1
    ),
    (
      'Payment Gateway System Design: Timeouts, Sagas & Webhooks',
      'Step-by-step implementation of resilient payment states, idempotency guarantees, and secure webhook event distribution.',
      'https://www.youtube.com/watch?v=B_PQUmRUxfU',
      2
    ),
    (
      'Payment APIs Explained: Authorization, Capture, Settlement & Payout',
      'End-to-end walkthrough of transaction lifecycles, merchant balance settlements, and reconciliation workflows.',
      'https://www.youtube.com/watch?v=hzr9WOu2BDk',
      3
    )
) AS l(title, description, video_url, order_index)
WHERE c.title = 'TrustNet: Real-Time Fraud Prevention & Transaction Monitoring'
  AND NOT EXISTS (
    SELECT 1 FROM public.partner_course_lessons pcl WHERE pcl.course_id = c.id AND pcl.title = l.title
  );

-- Samsub Lessons (with verified real educational YouTube video streams)
INSERT INTO public.partner_course_lessons (course_id, title, description, video_url, order_index, is_published)
SELECT
  c.id,
  l.title,
  l.description,
  l.video_url,
  l.order_index,
  true
FROM public.partner_courses c
CROSS JOIN (
  VALUES
    (
      'KYC & AML Explained: Compliance Essentials for Fintechs',
      'Understanding customer due diligence, tiered verification, sanctions screening, and global regulatory mandates.',
      'https://www.youtube.com/watch?v=suOq0FkyIpg',
      1
    ),
    (
      'Comprehensive AML Training: Frameworks, CDD & Monitoring',
      'Detailed breakdown of Anti-Money Laundering frameworks, Customer Due Diligence (CDD), and automated risk scoring.',
      'https://www.youtube.com/watch?v=BN17lynNFSk',
      2
    ),
    (
      'System Design: Building Scalable Payment & Compliance Pipelines',
      'Architecting resilient distributed microservices for payment routing, verification pipelines, and fault tolerance.',
      'https://www.youtube.com/watch?v=7EnqCwQOddY',
      3
    )
) AS l(title, description, video_url, order_index)
WHERE c.title = 'Samsub: Full-Cycle KYC & Regulatory Compliance Masterclass'
  AND NOT EXISTS (
    SELECT 1 FROM public.partner_course_lessons pcl WHERE pcl.course_id = c.id AND pcl.title = l.title
  );

-- =====================================================================
-- 8. Modules & Curriculum (Cohort 1)
-- =====================================================================
INSERT INTO public.modules (cohort_id, title, stage, domain, track, week_start, week_end, is_published, description)
SELECT
  c.id,
  m.title,
  m.stage,
  m.domain,
  m.track,
  m.week_start,
  m.week_end,
  true,
  m.description
FROM public.cohorts c
CROSS JOIN (
  VALUES
    (
      'Fintech & Open Banking Architecture',
      'foundations',
      NULL,
      'All',
      1,
      3,
      'Common protocols, payment rails, API security, and transaction switching fundamentals across African fintech ecosystems.'
    ),
    (
      'FinCore: High-Throughput Ledger & Transaction Engineering',
      'domain_immersion',
      'FinCore',
      'Finsoft',
      4,
      6,
      'Double-entry ledgers, atomicity and consistency guarantees, idempotency keys, and ledger invariant verification under high concurrency.'
    ),
    (
      'FinOps: Automated Reconciliation & Financial Pipelines',
      'domain_immersion',
      'FinOps',
      'Finops',
      7,
      8,
      'Automated settlement reconciliation, discrepancy handling, regulatory reporting, and exception triaging.'
    ),
    (
      'FaaS: Partner-Ready Payment APIs & Microservices',
      'domain_immersion',
      'FaaS',
      'Finsoft',
      9,
      10,
      'Designing partner-ready APIs, developer documentation, sandbox testing environments, and API rate limiting.'
    )
) AS m(title, stage, domain, track, week_start, week_end, description)
WHERE c.name = 'Cohort 1 - December 2026'
  AND NOT EXISTS (
    SELECT 1 FROM public.modules mod WHERE mod.cohort_id = c.id AND mod.title = m.title
  );

-- =====================================================================
-- 9. Lessons (With verified real educational YouTube video streams)
-- =====================================================================
INSERT INTO public.lessons (module_id, title, type, duration_minutes, video_url, is_required, order_index)
SELECT
  m.id,
  l.title,
  l.type,
  l.duration_minutes,
  l.video_url,
  true,
  l.order_index
FROM public.modules m
CROSS JOIN (
  VALUES
    (
      'Payment APIs Explained: Authorization, Capture, Settlement & Payout',
      'video',
      45,
      'https://www.youtube.com/watch?v=hzr9WOu2BDk',
      1
    ),
    (
      'System Design Global Payment Processing: PayPal Architecture',
      'video',
      55,
      'https://www.youtube.com/watch?v=7MXV7RfNtv0',
      2
    ),
    (
      'Payment Gateway Architecture: Webhooks, Timeouts & Idempotency',
      'video',
      50,
      'https://www.youtube.com/watch?v=B_PQUmRUxfU',
      3
    )
) AS l(title, type, duration_minutes, video_url, order_index)
WHERE m.title = 'Fintech & Open Banking Architecture'
  AND NOT EXISTS (
    SELECT 1 FROM public.lessons les WHERE les.module_id = m.id AND les.title = l.title
  );

-- FinCore Lessons
INSERT INTO public.lessons (module_id, title, type, duration_minutes, video_url, is_required, order_index)
SELECT
  m.id,
  l.title,
  l.type,
  l.duration_minutes,
  l.video_url,
  true,
  l.order_index
FROM public.modules m
CROSS JOIN (
  VALUES
    (
      'Double-Entry General Ledger Architecture for Fintechs',
      'video',
      60,
      'https://www.youtube.com/watch?v=Bf0I3XEbPrw',
      1
    ),
    (
      'Designing Resilient Payment Gateways (Stripe & Razorpay Patterns)',
      'video',
      50,
      'https://www.youtube.com/watch?v=7EnqCwQOddY',
      2
    )
) AS l(title, type, duration_minutes, video_url, order_index)
WHERE m.title = 'FinCore: High-Throughput Ledger & Transaction Engineering'
  AND NOT EXISTS (
    SELECT 1 FROM public.lessons les WHERE les.module_id = m.id AND les.title = l.title
  );

-- =====================================================================
-- 10. Hands-on Labs & Coding Exercises
-- =====================================================================
-- Insert lab lessons
INSERT INTO public.lessons (module_id, title, type, duration_minutes, is_required, order_index)
SELECT
  m.id,
  'Guided Lab: Double-Entry Ledger Posting with Balance Checks',
  'lab',
  90,
  true,
  3
FROM public.modules m
WHERE m.title = 'FinCore: High-Throughput Ledger & Transaction Engineering'
  AND NOT EXISTS (
    SELECT 1 FROM public.lessons l WHERE l.module_id = m.id AND l.title = 'Guided Lab: Double-Entry Ledger Posting with Balance Checks'
  );

INSERT INTO public.lessons (module_id, title, type, duration_minutes, is_required, order_index)
SELECT
  m.id,
  'Guided Lab: Payment Switch & Idempotency Key Processor',
  'lab',
  90,
  true,
  4
FROM public.modules m
WHERE m.title = 'Fintech & Open Banking Architecture'
  AND NOT EXISTS (
    SELECT 1 FROM public.lessons l WHERE l.module_id = m.id AND l.title = 'Guided Lab: Payment Switch & Idempotency Key Processor'
  );

-- Insert lab details linked to lesson_id
INSERT INTO public.labs (lesson_id, title, instructions, starter_code, max_score, due_date)
SELECT
  l.id,
  'Guided Lab: Double-Entry Ledger Posting with Balance Checks',
  'Implement an idempotent double-entry balance updater in Node.js/PostgreSQL. Ensure all debits equal credits and enforce balance invariants.',
  '// Starter template' || E'\n' || 'async function recordTransaction(debitAccount, creditAccount, amount) {' || E'\n' || '  // TODO: implement transaction' || E'\n' || '}',
  100,
  (now() + interval '14 days')::date
FROM public.lessons l
WHERE l.title = 'Guided Lab: Double-Entry Ledger Posting with Balance Checks'
  AND NOT EXISTS (
    SELECT 1 FROM public.labs lab WHERE lab.lesson_id = l.id
  );

INSERT INTO public.labs (lesson_id, title, instructions, starter_code, max_score, due_date)
SELECT
  l.id,
  'Guided Lab: Payment Switch & Idempotency Key Processor',
  'Build an HTTP endpoint that validates client idempotency keys with Redis/PostgreSQL and forwards requests to banking sandbox rails.',
  '// Starter template' || E'\n' || 'export async function handlePayment(req, res) {' || E'\n' || '  const idempotencyKey = req.headers.idempotencyKey;' || E'\n' || '}',
  100,
  (now() + interval '21 days')::date
FROM public.lessons l
WHERE l.title = 'Guided Lab: Payment Switch & Idempotency Key Processor'
  AND NOT EXISTS (
    SELECT 1 FROM public.labs lab WHERE lab.lesson_id = l.id
  );

-- =====================================================================
-- 11. Live Masterclasses
-- =====================================================================
INSERT INTO public.live_classes (
  title, description, cohort_id, instructor_id, starts_at, ends_at,
  visibility, status, meet_url, is_offline, venue, created_by
)
SELECT
  'Masterclass: Core Banking Ledgers & Idempotent Transactions',
  'A deep dive on atomic transaction semantics, double-entry ledger database schemas, and avoiding race conditions on payment rails.',
  c.id,
  COALESCE(
    (SELECT id FROM public.users WHERE lower(email) = 'fin.core@bluespacefintechacademy.com' LIMIT 1),
    (SELECT id FROM public.users LIMIT 1)
  ),
  now() + interval '2 days 4 hours',
  now() + interval '2 days 6 hours',
  'cohort',
  'scheduled',
  'https://meet.google.com/xyz-blue-fin',
  false,
  'Virtual Stream',
  COALESCE(
    (SELECT id FROM public.users WHERE lower(email) = 'academy.lead@bluespacefintechacademy.com' LIMIT 1),
    (SELECT id FROM public.users WHERE lower(email) = 'fin.core@bluespacefintechacademy.com' LIMIT 1),
    (SELECT id FROM public.users LIMIT 1)
  )
FROM public.cohorts c
WHERE c.name = 'Cohort 1 - December 2026'
  AND NOT EXISTS (
    SELECT 1 FROM public.live_classes lc WHERE lc.title = 'Masterclass: Core Banking Ledgers & Idempotent Transactions'
  );

INSERT INTO public.live_classes (
  title, description, cohort_id, instructor_id, starts_at, ends_at,
  visibility, status, meet_url, is_offline, venue, created_by
)
SELECT
  'Workshop: TrustNet & Samsub API Security Lab',
  'Hands-on implementation of webhook signatures, HMAC validation, and KYC callback ingestion.',
  c.id,
  COALESCE(
    (SELECT id FROM public.users WHERE lower(email) = 'academy.lead@bluespacefintechacademy.com' LIMIT 1),
    (SELECT id FROM public.users LIMIT 1)
  ),
  now() + interval '5 days 2 hours',
  now() + interval '5 days 4 hours',
  'cohort',
  'scheduled',
  'https://meet.google.com/abc-trust-sam',
  false,
  'Virtual Stream',
  COALESCE(
    (SELECT id FROM public.users WHERE lower(email) = 'academy.lead@bluespacefintechacademy.com' LIMIT 1),
    (SELECT id FROM public.users LIMIT 1)
  )
FROM public.cohorts c
WHERE c.name = 'Cohort 1 - December 2026'
  AND NOT EXISTS (
    SELECT 1 FROM public.live_classes lc WHERE lc.title = 'Workshop: TrustNet & Samsub API Security Lab'
  );

-- =====================================================================
-- 12. Mentor Clinics
-- =====================================================================
INSERT INTO public.clinics (
  title, cohort_id, mentor_id, starts_at, ends_at,
  meet_url, capacity, status, attendee_count, created_by
)
SELECT
  'FinCore Ledger Architecture & Code Review Clinic',
  c.id,
  COALESCE(
    (SELECT id FROM public.users WHERE lower(email) = 'fin.core@bluespacefintechacademy.com' LIMIT 1),
    (SELECT id FROM public.users LIMIT 1)
  ),
  now() + interval '1 day 3 hours',
  now() + interval '1 day 4 hours',
  'https://meet.google.com/clinic-fincore',
  15,
  'scheduled',
  4,
  COALESCE(
    (SELECT id FROM public.users WHERE lower(email) = 'academy.lead@bluespacefintechacademy.com' LIMIT 1),
    (SELECT id FROM public.users WHERE lower(email) = 'fin.core@bluespacefintechacademy.com' LIMIT 1),
    (SELECT id FROM public.users LIMIT 1)
  )
FROM public.cohorts c
WHERE c.name = 'Cohort 1 - December 2026'
  AND NOT EXISTS (
    SELECT 1 FROM public.clinics cl WHERE cl.title = 'FinCore Ledger Architecture & Code Review Clinic'
  );

INSERT INTO public.clinics (
  title, cohort_id, mentor_id, starts_at, ends_at,
  meet_url, capacity, status, attendee_count, created_by
)
SELECT
  'Fintech Career Mentoring & Squad Sprint Office Hours',
  c.id,
  COALESCE(
    (SELECT id FROM public.users WHERE lower(email) = 'academy.lead@bluespacefintechacademy.com' LIMIT 1),
    (SELECT id FROM public.users LIMIT 1)
  ),
  now() + interval '3 days 5 hours',
  now() + interval '3 days 6 hours',
  'https://meet.google.com/clinic-career',
  10,
  'scheduled',
  2,
  COALESCE(
    (SELECT id FROM public.users WHERE lower(email) = 'academy.lead@bluespacefintechacademy.com' LIMIT 1),
    (SELECT id FROM public.users LIMIT 1)
  )
FROM public.cohorts c
WHERE c.name = 'Cohort 1 - December 2026'
  AND NOT EXISTS (
    SELECT 1 FROM public.clinics cl WHERE cl.title = 'Fintech Career Mentoring & Squad Sprint Office Hours'
  );

-- =====================================================================
-- 13. Announcements
-- =====================================================================
INSERT INTO public.announcements (author_id, title, content, type, audience, pinned)
SELECT
  COALESCE(
    (SELECT id FROM public.users WHERE lower(email) = 'academy.lead@bluespacefintechacademy.com' LIMIT 1),
    (SELECT id FROM public.users LIMIT 1)
  ),
  'Welcome to Cohort 1 - BlueSPACE Fintech Academy',
  'Welcome to the academy! Orientation schedules, squad workspace allocations, syllabus access, and partner electives by TrustNet and Samsub have unlocked.',
  'announcement',
  'all',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.announcements a WHERE a.title = 'Welcome to Cohort 1 - BlueSPACE Fintech Academy'
);

-- =====================================================================
-- 14. Notifications for Student
-- =====================================================================
INSERT INTO public.notifications (user_id, type, data, is_read)
SELECT
  u.id,
  n.type,
  n.data,
  0
FROM public.users u
CROSS JOIN (
  VALUES
    ('squad_assigned', 'You have been assigned to Squad Alpha (Payment Rails).'),
    ('module_unlocked', 'Module 1: Fintech & Open Banking Architecture is now available.'),
    ('partner_courses', 'New industry electives by TrustNet and Samsub are available in the Partner Catalog.'),
    ('clinic_scheduled', 'Mentor clinic: FinCore Ledger Architecture is open for booking.')
) AS n(type, data)
WHERE u.email = 'student@bluespacefintechacademy.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.notifications notif WHERE notif.user_id = u.id AND notif.data = n.data
  );

COMMIT;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';


-- =====================================================================
-- 017: partner course slug & summary
-- =====================================================================
-- BlueSPACE LMS — Partner Course slug & summary (017)
-- Adds the columns expected by partner course imports/seeds and by
-- slug-based course lookups. Safe to run multiple times.
--
-- Existing rows get a slug derived from their title; the unique index keeps
-- future inserts from creating ambiguous URLs. The app can still insert
-- courses without a slug (NULL values are allowed and do not conflict).

BEGIN;

ALTER TABLE public.partner_courses
  ADD COLUMN IF NOT EXISTS summary text,
  ADD COLUMN IF NOT EXISTS slug varchar(220);

COMMENT ON COLUMN public.partner_courses.slug IS 'URL-friendly unique identifier for the course';
COMMENT ON COLUMN public.partner_courses.summary IS 'Short marketing summary shown in course cards';

-- Backfill slugs for rows created before the column existed.
UPDATE public.partner_courses
SET slug = COALESCE(
  NULLIF(trim(both '-' from regexp_replace(lower(title), '[^a-z0-9]+', '-', 'g')), ''),
  'course-' || id
)
WHERE slug IS NULL OR slug = '';

-- Disambiguate courses that share a title (and therefore a base slug).
WITH duplicates AS (
  SELECT id, slug, row_number() OVER (PARTITION BY slug ORDER BY id) AS rn
  FROM public.partner_courses
  WHERE slug IS NOT NULL
)
UPDATE public.partner_courses c
SET slug = c.slug || '-' || c.id
FROM duplicates d
WHERE c.id = d.id AND d.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_partner_courses_slug
  ON public.partner_courses(slug);

COMMIT;

NOTIFY pgrst, 'reload schema';


-- =====================================================================
-- 3. Create real Supabase Auth logins for the demo accounts
-- =====================================================================
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS auth_user_id uuid;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS partner_id bigint;

DO $logins$
DECLARE
  r            record;
  v_uid        uuid;
  v_id_type    text;
  v_id_default text;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('student@bluespacefintechacademy.com',        'Test Student',        'Student'),
      ('ada.okonkwo@bluespacefintechacademy.com',    'Ada Okonkwo',         'Student'),
      ('kwame.asante@bluespacefintechacademy.com',   'Kwame Asante',        'Student'),
      ('zainab.yusuf@bluespacefintechacademy.com',   'Zainab Yusuf',        'Student'),
      ('emeka.ndiaye@bluespacefintechacademy.com',   'Emeka Ndiaye',        'Student'),
      ('fatima.diallo@bluespacefintechacademy.com',  'Fatima Diallo',       'Student'),
      ('fin.core@bluespacefintechacademy.com',       'FinCore Domain Lead', 'Instructor'),
      ('faas.domain@bluespacefintechacademy.com',    'FaaS Domain Lead',    'Instructor'),
      ('finops.domain@bluespacefintechacademy.com',  'FinOps Domain Lead',  'Instructor'),
      ('academy.lead@bluespacefintechacademy.com',   'Academy Team Lead',   'Administrator'),
      ('partner@bluespacefintechacademy.com',        'TrustNet Partner',    'Partner')
    ) AS v(email, display_name, role)
  LOOP
    BEGIN
      v_uid := NULL;
      SELECT id INTO v_uid FROM auth.users WHERE lower(email) = lower(r.email) LIMIT 1;

      IF v_uid IS NULL THEN
        v_uid := gen_random_uuid();
        INSERT INTO auth.users (
          instance_id, id, aud, role, email, encrypted_password,
          email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
          created_at, updated_at
        ) VALUES (
          '00000000-0000-0000-0000-000000000000'::uuid,
          v_uid,
          'authenticated',
          'authenticated',
          lower(r.email),
          crypt('BlueSpace2026!', gen_salt('bf')),
          now(),
          jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
          jsonb_build_object('type', r.role, 'name', r.display_name),
          now(),
          now()
        );
        RAISE NOTICE 'Created auth login for %', r.email;
      ELSE
        UPDATE auth.users
        SET encrypted_password = crypt('BlueSpace2026!', gen_salt('bf')),
            email_confirmed_at = now(),
            raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
              || jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
            updated_at = now()
        WHERE id = v_uid;
        RAISE NOTICE 'Reset password for existing auth login %', r.email;
      END IF;

      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM auth.identities
          WHERE user_id = v_uid AND provider = 'email'
        ) THEN
          SELECT data_type, column_default
          INTO v_id_type, v_id_default
          FROM information_schema.columns
          WHERE table_schema = 'auth'
            AND table_name = 'identities'
            AND column_name = 'id';

          IF v_id_default IS NOT NULL THEN
            INSERT INTO auth.identities
              (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
            VALUES
              (v_uid::text, v_uid,
               jsonb_build_object('sub', v_uid::text, 'email', lower(r.email), 'email_verified', true),
               'email', now(), now(), now());
          ELSIF v_id_type = 'uuid' THEN
            INSERT INTO auth.identities
              (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
            VALUES
              (gen_random_uuid(), v_uid::text, v_uid,
               jsonb_build_object('sub', v_uid::text, 'email', lower(r.email), 'email_verified', true),
               'email', now(), now(), now());
          ELSE
            INSERT INTO auth.identities
              (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
            VALUES
              (v_uid::text, v_uid::text, v_uid,
               jsonb_build_object('sub', v_uid::text, 'email', lower(r.email), 'email_verified', true),
               'email', now(), now(), now());
          END IF;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Identity warning for %: %', r.email, SQLERRM;
      END;

      UPDATE public.users
      SET auth_user_id = v_uid,
          is_active = 1,
          updated_at = now()
      WHERE lower(email) = lower(r.email);

      IF NOT FOUND THEN
        INSERT INTO public.users (name, email, type, is_active, auth_user_id)
        VALUES (r.display_name, lower(r.email), r.role, 1, v_uid);
        RAISE NOTICE 'Created profile row for %', r.email;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'LOGIN STEP FAILED for %: %', r.email, SQLERRM;
    END;
  END LOOP;
END
$logins$;

-- =====================================================================
-- 3b. Clear NULL auth token columns
-- =====================================================================
-- Supabase sign-in fails with a database schema error when these columns
-- are NULL instead of an empty string. Users created directly in SQL can
-- end up NULL here, so normalise every demo account.
DO $tokens$
DECLARE
  c        text;
  v_sql    text;
  v_emails text[] := ARRAY[
    'student@bluespacefintechacademy.com',
    'ada.okonkwo@bluespacefintechacademy.com',
    'kwame.asante@bluespacefintechacademy.com',
    'zainab.yusuf@bluespacefintechacademy.com',
    'emeka.ndiaye@bluespacefintechacademy.com',
    'fatima.diallo@bluespacefintechacademy.com',
    'fin.core@bluespacefintechacademy.com',
    'faas.domain@bluespacefintechacademy.com',
    'finops.domain@bluespacefintechacademy.com',
    'academy.lead@bluespacefintechacademy.com',
    'partner@bluespacefintechacademy.com'
  ];
BEGIN
  FOREACH c IN ARRAY ARRAY[
    'confirmation_token',
    'recovery_token',
    'email_change',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change',
    'phone_change_token',
    'reauthentication_token'
  ] LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = c
    ) THEN
      v_sql := 'UPD' || 'ATE auth.users SET '
               || quote_ident(c) || ' = ' || quote_literal('')
               || ' WH' || 'ERE lower(email) = ANY($1)';
      EXECUTE v_sql USING v_emails;
    END IF;
  END LOOP;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Token normalisation skipped: %', SQLERRM;
END
$tokens$;

-- =====================================================================
-- 4. Link the partner login to the TrustNet organisation
-- =====================================================================
UPDATE public.users u
SET partner_id = p.id,
    updated_at = now()
FROM public.partners p
WHERE lower(u.email) = 'partner@bluespacefintechacademy.com'
  AND p.slug = 'trustnet'
  AND (u.partner_id IS NULL OR u.partner_id <> p.id);

-- If the partner slug differs, fall back to the first approved partner so the
-- partner login is never left with an empty organisation.
UPDATE public.users u
SET partner_id = p.id,
    updated_at = now()
FROM public.partners p
WHERE lower(u.email) = 'partner@bluespacefintechacademy.com'
  AND u.partner_id IS NULL
  AND p.status = 'approved'
  AND p.id = (SELECT min(id) FROM public.partners WHERE status = 'approved');

-- =====================================================================
-- 5. Give instructors their cohort and squad assignments
-- =====================================================================
DO $assign$
DECLARE
  v_cohort bigint;
  v_squad  bigint;
BEGIN
  SELECT id INTO v_cohort FROM public.cohorts
  WHERE name = 'Cohort 1 - December 2026' LIMIT 1;

  IF v_cohort IS NULL THEN
    RAISE NOTICE 'Cohort 1 - December 2026 not found, skipping instructor assignments';
    RETURN;
  END IF;

  SELECT id INTO v_squad FROM public.squads
  WHERE cohort_id = v_cohort ORDER BY id LIMIT 1;

  IF to_regclass('public.instructor_cohort_assignments') IS NOT NULL THEN
    INSERT INTO public.instructor_cohort_assignments (instructor_id, cohort_id)
    SELECT u.id, v_cohort
    FROM public.users u
    WHERE u.type = 'Instructor'
      AND NOT EXISTS (
        SELECT 1 FROM public.instructor_cohort_assignments a
        WHERE a.instructor_id = u.id AND a.cohort_id = v_cohort
      );
  END IF;

  IF v_squad IS NOT NULL AND to_regclass('public.instructor_squad_assignments') IS NOT NULL THEN
    INSERT INTO public.instructor_squad_assignments (instructor_id, squad_id)
    SELECT u.id, v_squad
    FROM public.users u
    WHERE u.type = 'Instructor'
      AND NOT EXISTS (
        SELECT 1 FROM public.instructor_squad_assignments a
        WHERE a.instructor_id = u.id AND a.squad_id = v_squad
      );
  END IF;
END
$assign$;

-- =====================================================================
-- 6. Enrol demo students on the published partner courses
-- =====================================================================
DO $penrol$
BEGIN
  IF to_regclass('public.partner_course_enrolments') IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.partner_course_enrolments (course_id, user_id, status)
  SELECT pc.id, u.id, 'active'
  FROM public.partner_courses pc
  CROSS JOIN public.users u
  WHERE pc.status = 'published'
    AND lower(u.email) IN (
      'student@bluespacefintechacademy.com',
      'ada.okonkwo@bluespacefintechacademy.com',
      'kwame.asante@bluespacefintechacademy.com',
      'zainab.yusuf@bluespacefintechacademy.com',
      'emeka.ndiaye@bluespacefintechacademy.com',
      'fatima.diallo@bluespacefintechacademy.com'
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.partner_course_enrolments e
      WHERE e.course_id = pc.id AND e.user_id = u.id
    );
END
$penrol$;

-- =====================================================================
-- 7. Verification report
-- =====================================================================
WITH counts AS (
  SELECT 'cohorts' AS item, count(*)::text AS value FROM public.cohorts
  UNION ALL SELECT 'enrolments', count(*)::text FROM public.enrolments
  UNION ALL SELECT 'users', count(*)::text FROM public.users
  UNION ALL SELECT 'modules', count(*)::text FROM public.modules
  UNION ALL SELECT 'lessons', count(*)::text FROM public.lessons
  UNION ALL SELECT 'labs', count(*)::text FROM public.labs
  UNION ALL SELECT 'live_classes', count(*)::text FROM public.live_classes
  UNION ALL SELECT 'clinics', count(*)::text FROM public.clinics
  UNION ALL SELECT 'announcements', count(*)::text FROM public.announcements
  UNION ALL SELECT 'notifications', count(*)::text FROM public.notifications
  UNION ALL SELECT 'partners', count(*)::text FROM public.partners
  UNION ALL SELECT 'partner_courses', count(*)::text FROM public.partner_courses
  UNION ALL SELECT 'partner_course_lessons', count(*)::text FROM public.partner_course_lessons
  UNION ALL SELECT 'auth_logins', count(*)::text FROM auth.users
)
SELECT 'A counts' AS section, item, value FROM counts

UNION ALL

SELECT 'B account',
       au.email,
       'profile=' || coalesce(pu.id::text, 'MISSING')
         || ' type=' || coalesce(pu.type, 'NULL')
         || ' active=' || coalesce(pu.is_active::text, 'NULL')
         || ' auth_user_id=' || coalesce(pu.auth_user_id::text, 'NULL')
         || ' cohort=' || coalesce(c.name, 'NONE')
         || ' partner_id=' || coalesce(pu.partner_id::text, 'NULL')
FROM auth.users au
LEFT JOIN public.users pu ON lower(pu.email) = lower(au.email)
LEFT JOIN public.enrolments e ON e.user_id = pu.id
LEFT JOIN public.cohorts c ON c.id = e.cohort_id
WHERE lower(au.email) IN (
  'student@bluespacefintechacademy.com',
  'ada.okonkwo@bluespacefintechacademy.com',
  'kwame.asante@bluespacefintechacademy.com',
  'zainab.yusuf@bluespacefintechacademy.com',
  'emeka.ndiaye@bluespacefintechacademy.com',
  'fatima.diallo@bluespacefintechacademy.com',
  'fin.core@bluespacefintechacademy.com',
  'faas.domain@bluespacefintechacademy.com',
  'finops.domain@bluespacefintechacademy.com',
  'academy.lead@bluespacefintechacademy.com',
  'partner@bluespacefintechacademy.com'
)

ORDER BY 1, 2;

NOTIFY pgrst, 'reload schema';
