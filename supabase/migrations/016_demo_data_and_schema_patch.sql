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
VALUES
  ('Cohort 1 - December 2026', '2026-12-01', '2027-04-15', 40, true, true, 'active'),
  ('Cohort 2 - March 2027', '2027-03-01', '2027-07-15', 40, true, true, 'planned')
ON CONFLICT DO NOTHING;

-- =====================================================================
-- 4. Squads
-- =====================================================================
INSERT INTO public.squads (cohort_id, name, squad_lead_id)
SELECT
  c.id,
  'Squad Alpha (Payment Rails)',
  (SELECT id FROM public.users WHERE email = 'ada.okonkwo@bluespacefintechacademy.com')
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
      'Double-entry ledgers, ACID guarantees, idempotency keys, and ledger invariant verification under high concurrency.'
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
  'Build an HTTP endpoint that validates client idempotency keys using Redis/PostgreSQL and forwards requests to banking sandbox rails.',
  '// Starter template' || E'\n' || 'export async function handlePayment(req, res) {' || E'\n' || '  const idempotencyKey = req.headers["idempotency-key"];' || E'\n' || '}',
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
  'Deep dive into ACID transaction semantics, double-entry ledger database schemas, and avoiding race conditions on payment rails.',
  c.id,
  (SELECT id FROM public.users WHERE email = 'fin.core@bluespacefintechacademy.com'),
  now() + interval '2 days 4 hours',
  now() + interval '2 days 6 hours',
  'cohort',
  'scheduled',
  'https://meet.google.com/xyz-blue-fin',
  false,
  'Virtual Stream',
  (SELECT id FROM public.users WHERE email = 'academy.lead@bluespacefintechacademy.com')
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
  (SELECT id FROM public.users WHERE email = 'academy.lead@bluespacefintechacademy.com'),
  now() + interval '5 days 2 hours',
  now() + interval '5 days 4 hours',
  'cohort',
  'scheduled',
  'https://meet.google.com/abc-trust-sam',
  false,
  'Virtual Stream',
  (SELECT id FROM public.users WHERE email = 'academy.lead@bluespacefintechacademy.com')
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
  (SELECT id FROM public.users WHERE email = 'fin.core@bluespacefintechacademy.com'),
  now() + interval '1 day 3 hours',
  now() + interval '1 day 4 hours',
  'https://meet.google.com/clinic-fincore',
  15,
  'scheduled',
  4,
  (SELECT id FROM public.users WHERE email = 'academy.lead@bluespacefintechacademy.com')
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
  (SELECT id FROM public.users WHERE email = 'academy.lead@bluespacefintechacademy.com'),
  now() + interval '3 days 5 hours',
  now() + interval '3 days 6 hours',
  'https://meet.google.com/clinic-career',
  10,
  'scheduled',
  2,
  (SELECT id FROM public.users WHERE email = 'academy.lead@bluespacefintechacademy.com')
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
  (SELECT id FROM public.users WHERE email = 'academy.lead@bluespacefintechacademy.com'),
  'Welcome to Cohort 1 - BlueSPACE Fintech Academy',
  'Welcome to the academy! Orientation schedules, squad workspace allocations, syllabus access, and partner electives from TrustNet and Samsub have unlocked.',
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
    ('partner_courses', 'New industry electives from TrustNet and Samsub are available in the Partner Catalog.'),
    ('clinic_scheduled', 'Mentor clinic: FinCore Ledger Architecture is open for booking.')
) AS n(type, data)
WHERE u.email = 'student@bluespacefintechacademy.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.notifications notif WHERE notif.user_id = u.id AND notif.data = n.data
  );

COMMIT;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
