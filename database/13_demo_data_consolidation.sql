-- 13_demo_data_consolidation.sql
--
-- Deep scan and demo data consolidation:
-- 1. Remove duplicate cohorts (id > 36) and clean up duplicate modules/enrolments/squads.
-- 2. Consolidate students in Cohort 33 into two active squads:
--    - Squad 6: Squad Alpha (Payment Rails) [Ada Okonkwo (Lead), Kwame Asante, Test Student]
--    - Squad 15: Squad Beta (Core Banking Ledgers) [Zainab Yusuf (Lead), Emeka Ndiaye, Fatima Diallo]
-- 3. Populate missing lessons in Cohort 33 modules so 100% of modules have lessons.
-- 4. Create 3 pending submissions awaiting review in the Evaluation & Grading Center.
-- 5. Add today's live class so the Student Dashboard shows an active live session.
-- 6. Add partner course video URLs and publish them to Cohort 33.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Clean up duplicate cohorts created by previous runs
-- ---------------------------------------------------------------------------

-- Delete duplicate enrolments for cohorts > 36
DELETE FROM public.enrolments WHERE cohort_id > 36;

-- Delete duplicate clinic bookings and clinics for cohorts > 36
DELETE FROM public.clinic_bookings WHERE clinic_id IN (SELECT id FROM public.clinics WHERE cohort_id > 36);
DELETE FROM public.clinics WHERE cohort_id > 36;

-- Delete duplicate live class attendance and live classes for cohorts > 36
DELETE FROM public.live_class_attendance WHERE live_class_id IN (SELECT id FROM public.live_classes WHERE cohort_id > 36);
DELETE FROM public.live_classes WHERE cohort_id > 36;

-- Delete duplicate submissions, labs, lesson progress, lessons, and modules for cohorts > 36
DELETE FROM public.submissions WHERE lab_id IN (
  SELECT id FROM public.labs WHERE lesson_id IN (
    SELECT id FROM public.lessons WHERE module_id IN (
      SELECT id FROM public.modules WHERE cohort_id > 36
    )
  )
);
DELETE FROM public.labs WHERE lesson_id IN (
  SELECT id FROM public.lessons WHERE module_id IN (
    SELECT id FROM public.modules WHERE cohort_id > 36
  )
);
DELETE FROM public.lesson_progress WHERE lesson_id IN (
  SELECT id FROM public.lessons WHERE module_id IN (
    SELECT id FROM public.modules WHERE cohort_id > 36
  )
);
DELETE FROM public.lessons WHERE module_id IN (
  SELECT id FROM public.modules WHERE cohort_id > 36
);
DELETE FROM public.modules WHERE cohort_id > 36;

-- Delete sprint deliverables, sprints, use cases, and squads for cohorts > 36
DELETE FROM public.sprint_deliverables WHERE sprint_id IN (
  SELECT id FROM public.sprints WHERE squad_id IN (
    SELECT id FROM public.squads WHERE cohort_id > 36
  )
);
DELETE FROM public.sprints WHERE squad_id IN (
  SELECT id FROM public.squads WHERE cohort_id > 36
);
DELETE FROM public.use_cases WHERE cohort_id > 36;
DELETE FROM public.squads WHERE cohort_id > 36;

-- Delete certifications and instructor assignments for cohorts > 36
DELETE FROM public.certifications WHERE cohort_id > 36;
DELETE FROM public.instructor_cohort_assignments WHERE cohort_id > 36;
UPDATE public.partner_courses SET cohort_id = 33 WHERE cohort_id > 36;

-- Delete duplicate cohorts
DELETE FROM public.cohorts WHERE id > 36;

-- ---------------------------------------------------------------------------
-- 2. Consolidate Squads in Cohort 33
-- ---------------------------------------------------------------------------

UPDATE public.squads
SET name = 'Squad Alpha (Payment Rails)',
    squad_lead_id = 117 -- Ada Okonkwo
WHERE id = 6;

UPDATE public.squads
SET name = 'Squad Beta (Core Banking Ledgers)',
    squad_lead_id = 119 -- Zainab Yusuf
WHERE id = 15;

-- Assign students to Squad Alpha (id 6): Ada Okonkwo (117), Kwame Asante (118), Test Student (129)
UPDATE public.enrolments
SET squad_id = 6,
    cohort_id = 33
WHERE user_id IN (117, 118, 129);

-- Assign students to Squad Beta (id 15): Zainab Yusuf (119), Emeka Ndiaye (120), Fatima Diallo (121)
UPDATE public.enrolments
SET squad_id = 15,
    cohort_id = 33
WHERE user_id IN (119, 120, 121);

-- Ensure a use case exists for Squad Alpha
INSERT INTO public.use_cases (id, cohort_id, domain, title, description, stakeholder, sandbox_access, anonymised_data, confidentiality_terms, status, squad_id)
VALUES
  (6, 33, 'FaaS', 'High-Throughput Mobile Money Switching Engine', 'Design and deploy a payment switch that routes Momo, Card, and Bank transfers with sub-second SLA and idempotency guarantees.', 'PayEngine Africa', true, true, true, 'assigned', 6)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, squad_id = 6;

-- Ensure a use case exists for Squad Beta
INSERT INTO public.use_cases (id, cohort_id, domain, title, description, stakeholder, sandbox_access, anonymised_data, confidentiality_terms, status, squad_id)
VALUES
  (15, 33, 'FinCore', 'Double-Entry Core Banking Ledger with Real-Time Settlement', 'Immutable double-entry transaction posting engine ensuring zero balance discrepancies under high concurrency.', 'TrustNet Financial', true, true, true, 'assigned', 15)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, squad_id = 15;

-- Ensure sprints exist for both squads
INSERT INTO public.sprints (id, use_case_id, squad_id, sprint_number, start_date, end_date, status, uat_completed)
VALUES
  (61, 6, 6, 1, '2026-11-01', '2026-11-14', 'completed', true),
  (62, 6, 6, 2, '2026-11-15', '2026-11-28', 'active', false),
  (151, 15, 15, 1, '2026-11-01', '2026-11-14', 'completed', true),
  (152, 15, 15, 2, '2026-11-15', '2026-11-28', 'active', false)
ON CONFLICT (id) DO NOTHING;

-- Ensure sprint deliverables exist
INSERT INTO public.sprint_deliverables (id, sprint_id, user_id, title, description, evidence_url, status, submitted_at)
VALUES
  (601, 61, 117, 'Payment Switch Architecture & Sequence Diagram', 'Specification for double-entry ledger settlement and ISO 8583 payload validation.', 'https://github.com/bluespacefintech/payments-switch-core', 'accepted', NOW() - INTERVAL '4 days'),
  (602, 62, 129, 'Idempotency Key Middleware & Redis Lock Store', 'Distributed locking and replay attack prevention for high-volume debit transactions.', 'https://github.com/bluespacefintech/idempotency-key-filter', 'submitted', NOW() - INTERVAL '1 day'),
  (1501, 151, 119, 'Core Banking Double-Entry Journal Schema', 'PostgreSQL immutable journal ledger with balance validation constraints.', 'https://github.com/bluespacefintech/double-entry-ledger', 'accepted', NOW() - INTERVAL '3 days'),
  (1502, 152, 120, 'Kafka Transaction Stream Processor', 'Event-driven event pipeline for inter-bank transaction settlement.', 'https://github.com/bluespacefintech/kafka-ledger-stream', 'submitted', NOW() - INTERVAL '18 hours')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. Populate missing lessons in Cohort 33 modules
-- ---------------------------------------------------------------------------

-- Module 7: Regulation, Compliance and Risk Basics
INSERT INTO public.lessons (module_id, title, order_index, type, duration_minutes, is_required, video_url)
VALUES
  (7, 'AML/KYC Regulatory Frameworks in African Fintech', 1, 'video', 35, true, 'https://www.youtube.com/watch?v=7MXV7RfNtv0'),
  (7, 'Suspicious Activity Reporting (SAR) & Velocity Rules', 2, 'video', 40, true, 'https://www.youtube.com/watch?v=7MXV7RfNtv0'),
  (7, 'Consumer Protection & Data Privacy (NDPR & GDPR)', 3, 'concept', 25, true, null)
ON CONFLICT DO NOTHING;

-- Module 8: AI in the Factory
INSERT INTO public.lessons (module_id, title, order_index, type, duration_minutes, is_required, video_url)
VALUES
  (8, 'ML Anomaly Detection in Real-Time Card Authorizations', 1, 'video', 45, true, 'https://www.youtube.com/watch?v=7MXV7RfNtv0'),
  (8, 'LLM Agents in Financial Compliance & Dispute Automation', 2, 'video', 50, true, 'https://www.youtube.com/watch?v=7MXV7RfNtv0'),
  (8, 'Model Governance & Explainable AI in Credit Underwriting', 3, 'concept', 30, true, null)
ON CONFLICT DO NOTHING;

-- Module 12: FinInfra: CI/CD, Cloud and Observability
INSERT INTO public.lessons (module_id, title, order_index, type, duration_minutes, is_required, video_url)
VALUES
  (12, 'Containerizing Payment Switches & HSM Emulators', 1, 'video', 40, true, 'https://www.youtube.com/watch?v=7MXV7RfNtv0'),
  (12, 'Zero-Downtime Blue/Green Deployments with Kubernetes', 2, 'video', 50, true, 'https://www.youtube.com/watch?v=7MXV7RfNtv0'),
  (12, 'Observability, Distributed Tracing & SLOs for FinTech', 3, 'concept', 35, true, null)
ON CONFLICT DO NOTHING;

-- Module 39: FinOps: Automated Reconciliation & Financial Pipelines
INSERT INTO public.lessons (module_id, title, order_index, type, duration_minutes, is_required, video_url)
VALUES
  (39, 'End-of-Day Settlement Engine Architecture', 1, 'video', 45, true, 'https://www.youtube.com/watch?v=7MXV7RfNtv0'),
  (39, '3-Way Reconciliation Pipelines with Pandas & SQL', 2, 'video', 55, true, 'https://www.youtube.com/watch?v=7MXV7RfNtv0'),
  (39, 'Exception Handling, Break-Fix Journals & Chargebacks', 3, 'concept', 30, true, null)
ON CONFLICT DO NOTHING;

-- Module 40: FaaS: Partner-Ready Payment APIs & Microservices
INSERT INTO public.lessons (module_id, title, order_index, type, duration_minutes, is_required, video_url)
VALUES
  (40, 'Idempotent Webhooks & Cryptographic Signature Verification', 1, 'video', 40, true, 'https://www.youtube.com/watch?v=7MXV7RfNtv0'),
  (40, 'RESTful Payment Gateway Integration Standards', 2, 'video', 50, true, 'https://www.youtube.com/watch?v=7MXV7RfNtv0'),
  (40, 'Circuit Breakers & Rate Limiting for Switch Resiliency', 3, 'concept', 30, true, null)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4. Create Labs for Modules and Add Pending Submissions for Grading
-- ---------------------------------------------------------------------------

-- Create a Lab on Module 7 Lesson 1
INSERT INTO public.labs (lesson_id, title, max_score, starter_code, instructions)
SELECT l.id, 'Lab: AML Velocity Check Engine', 100, 'def check_velocity(account_id, window_seconds=60, max_tx=3):\n    # TODO: Implement in Redis\n    pass', 'Implement a rate-based transaction velocity filter that flags accounts with >3 debits within 60 seconds.'
FROM public.lessons l
WHERE l.module_id = 7 AND l.order_index = 1
LIMIT 1
ON CONFLICT DO NOTHING;

-- Create a Lab on Module 12 Lesson 1
INSERT INTO public.labs (lesson_id, title, max_score, starter_code, instructions)
SELECT l.id, 'Lab: Dockerized Payment Switch Deployment', 100, 'FROM alpine:latest\n# TODO: Hardened Dockerfile', 'Create a hardened Dockerfile and health probe for an ISO 8583 switch emulator.'
FROM public.lessons l
WHERE l.module_id = 12 AND l.order_index = 1
LIMIT 1
ON CONFLICT DO NOTHING;

-- Create 3 Pending Submissions awaiting instructor review in Evaluation & Grading
-- Kwame Asante (118)
INSERT INTO public.submissions (user_id, lab_id, status, content_url, score, feedback, submitted_at)
SELECT 118, l.id, 'submitted', 'https://github.com/kwame-asante/payment-switch-idempotency', NULL, NULL, NOW() - INTERVAL '3 hours'
FROM public.labs l
WHERE l.title ILIKE '%idempotency%' OR l.id = 13
LIMIT 1;

-- Zainab Yusuf (119)
INSERT INTO public.submissions (user_id, lab_id, status, content_url, score, feedback, submitted_at)
SELECT 119, l.id, 'submitted', 'https://github.com/zainab-yusuf/double-entry-ledger-checks', NULL, NULL, NOW() - INTERVAL '5 hours'
FROM public.labs l
WHERE l.title ILIKE '%double-entry%' OR l.id = 13
LIMIT 1;

-- Ada Okonkwo (117)
INSERT INTO public.submissions (user_id, lab_id, status, content_url, score, feedback, submitted_at)
SELECT 117, l.id, 'submitted', 'https://github.com/ada-okonkwo/aml-velocity-checker', NULL, NULL, NOW() - INTERVAL '1 hour'
FROM public.labs l
WHERE l.title ILIKE '%AML%'
LIMIT 1;

-- ---------------------------------------------------------------------------
-- 5. Add Active / Upcoming Live Classes for Cohort 33
-- ---------------------------------------------------------------------------

-- Update or insert a live class for Today
INSERT INTO public.live_classes (
  cohort_id,
  module_id,
  instructor_id,
  title,
  description,
  starts_at,
  ends_at,
  meet_url,
  status,
  is_offline,
  venue
)
VALUES
  (
    33,
    6,
    130, -- Test Instructor
    'Masterclass: Core Banking Ledgers & Idempotent Transactions',
    'Interactive deep-dive on double-entry accounting invariants, ACID transactions, and African payment switch rails.',
    NOW() - INTERVAL '15 minutes',
    NOW() + INTERVAL '1 hour 45 minutes',
    'https://meet.google.com/xyz-fintech-masterclass',
    'live',
    false,
    null
  ),
  (
    33,
    7,
    122, -- FinCore Lead
    'Regulatory Sandbox Compliance & Anti-Money Laundering Architecture',
    'Operational compliance, velocity checks, and transaction monitoring pipelines for African payments.',
    NOW() + INTERVAL '2 days',
    NOW() + INTERVAL '2 days 2 hours',
    'https://meet.google.com/abc-fintech-clinic',
    'scheduled',
    false,
    null
  );

-- Enroll students into the live class attendance
INSERT INTO public.live_class_attendance (live_class_id, user_id, status)
SELECT lc.id, u.id, 'attended'
FROM public.live_classes lc
CROSS JOIN public.users u
WHERE lc.status = 'live' AND u.id IN (117, 118, 119, 120, 121, 129)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 6. Enrich Partner Course & Lessons
-- ---------------------------------------------------------------------------

-- Ensure partner course 7 has video details and is published for Cohort 33
UPDATE public.partner_courses
SET video_url = 'https://www.youtube.com/watch?v=7MXV7RfNtv0',
    media_provider = 'youtube',
    cohort_id = 33,
    status = 'published',
    thumbnail_url = 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1200&auto=format&fit=crop&q=80',
    partner_logo_url = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80'
WHERE id = 7;

-- Ensure partner course lessons have video_url and media_provider
UPDATE public.partner_course_lessons
SET type = 'video',
    media_provider = 'youtube',
    video_url = 'https://www.youtube.com/watch?v=7MXV7RfNtv0',
    is_published = true
WHERE course_id = 7 AND (video_url IS NULL OR video_url = '');

COMMIT;
