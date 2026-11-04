-- =============================================================
-- BlueSPACE Fintech Academy LMS — Seed Data
-- Run this AFTER schema.sql in the Supabase SQL Editor
-- Creates test users for Student, Instructor, and Administrator roles
-- =============================================================

-- Insert test users (auth.users handles auth; this creates profiles)
INSERT INTO public.users (name, email, type, avatar, is_active, force_password_change) VALUES
  -- Finsoft Student
  ('Ada Okonkwo', 'ada.okonkwo@bluespacefintechacademy.com', 'Student', 'avatar.png', 1, 0),
  -- Finops Student
  ('Kwame Asante', 'kwame.asante@bluespacefintechacademy.com', 'Student', 'avatar.png', 1, 0),
  -- Finsoft Student 2
  ('Zainab Yusuf', 'zainab.yusuf@bluespacefintechacademy.com', 'Student', 'avatar.png', 1, 0),
  -- Finops Student 2
  ('Emeka Ndiaye', 'emeka.ndiaye@bluespacefintechacademy.com', 'Student', 'avatar.png', 1, 0),
  -- Instructors
  ('FinCore Domain Lead', 'fin.core@bluespacefintechacademy.com', 'Instructor', 'avatar.png', 1, 0),
  ('FaaS Domain Lead', 'faas.domain@bluespacefintechacademy.com', 'Instructor', 'avatar.png', 1, 0),
  ('FinOps Domain Lead', 'finops.domain@bluespacefintechacademy.com', 'Instructor', 'avatar.png', 1, 0),
  ('FinInfra Domain Lead', 'fininfra.domain@bluespacefintechacademy.com', 'Instructor', 'avatar.png', 1, 0),
  -- Administrators
  ('Academy Team Lead', 'academy.lead@bluespacefintechacademy.com', 'Administrator', 'avatar.png', 1, 0),
  ('Cohort Coordinator', 'coordinator@bluespacefintechacademy.com', 'Administrator', 'avatar.png', 1, 0)
ON CONFLICT (email) DO NOTHING;

-- Insert Cohorts
INSERT INTO public.cohorts (name, start_date, end_date, capacity, track_finsoft, track_finops, status) VALUES
  ('Cohort 1 - December 2026', '2026-12-01', '2027-04-15', 40, true, true, 'active'),
  ('Cohort 2 - March 2027', '2027-03-01', '2027-07-15', 40, true, true, 'planned'),
  ('Cohort 3 - June 2027', '2027-06-01', '2027-09-15', 40, true, true, 'planned'),
  ('Cohort 4 - September 2027', '2027-09-01', '2028-01-15', 40, true, true, 'planned');

-- Enrol Cohort 1 students
INSERT INTO public.enrolments (cohort_id, user_id, track, status) VALUES
  ((SELECT id FROM public.cohorts WHERE name = 'Cohort 1 - December 2026'), (SELECT id FROM public.users WHERE email = 'ada.okonkwo@bluespacefintechacademy.com'), 'Finsoft', 'active'),
  ((SELECT id FROM public.cohorts WHERE name = 'Cohort 1 - December 2026'), (SELECT id FROM public.users WHERE email = 'kwame.asante@bluespacefintechacademy.com'), 'Finsoft', 'active'),
  ((SELECT id FROM public.cohorts WHERE name = 'Cohort 1 - December 2026'), (SELECT id FROM public.users WHERE email = 'zainab.yusuf@bluespacefintechacademy.com'), 'Finsoft', 'active'),
  ((SELECT id FROM public.cohorts WHERE name = 'Cohort 1 - December 2026'), (SELECT id FROM public.users WHERE email = 'emeka.ndiaye@bluespacefintechacademy.com'), 'Finops', 'active'),
  ((SELECT id FROM public.cohorts WHERE name = 'Cohort 1 - December 2026'), (SELECT id FROM public.users WHERE email = 'fatima.diallo@bluespacefintechacademy.com'), 'Finops', 'active');

-- Create Squad Alpha
INSERT INTO public.squads (cohort_id, name, squad_lead_id) VALUES
  ((SELECT id FROM public.cohorts WHERE name = 'Cohort 1 - December 2026'), 'Squad Alpha', (SELECT id FROM public.users WHERE email = 'ada.okonkwo@bluespacefintechacademy.com'));

-- Update enrolments with squad_id
UPDATE public.enrolments SET squad_id = (SELECT id FROM public.squads WHERE name = 'Squad Alpha')
WHERE cohort_id = (SELECT id FROM public.cohorts WHERE name = 'Cohort 1 - December 2026')
AND user_id IN (
  SELECT id FROM public.users WHERE email IN (
    'ada.okonkwo@bluespacefintechacademy.com',
    'kwame.asante@bluespacefintechacademy.com',
    'zainab.yusuf@bluespacefintechacademy.com',
    'emeka.ndiaye@bluespacefintechacademy.com',
    'fatima.diallo@bluespacefintechacademy.com'
  )
);

-- Insert Foundations modules
INSERT INTO public.modules (cohort_id, title, stage, domain, track, week_start, week_end, is_published, description, created_by) VALUES
  ((SELECT id FROM public.cohorts WHERE name = 'Cohort 1 - December 2026'), 'Fintech and Payments Fundamentals', 'foundations', NULL, 'All', 1, 3, true, 'Common language and ways of working across fintech, AI and online collaboration', (SELECT id FROM public.users WHERE email = 'academy.lead@bluespacefintechacademy.com')),
  ((SELECT id FROM public.cohorts WHERE name = 'Cohort 1 - December 2026'), 'Regulation, Compliance and Risk Basics', 'foundations', NULL, 'All', 1, 3, true, 'Regulation, compliance and risk basics for fintech', (SELECT id FROM public.users WHERE email = 'academy.lead@bluespacefintechacademy.com')),
  ((SELECT id FROM public.cohorts WHERE name = 'Cohort 1 - December 2026'), 'AI in the Factory', 'foundations', NULL, 'All', 2, 3, true, 'How AI is used across the Factory', (SELECT id FROM public.users WHERE email = 'academy.lead@bluespacefintechacademy.com')),
  ((SELECT id FROM public.cohorts WHERE name = 'Cohort 1 - December 2026'), 'FinCore: Ledger and Transaction Engineering', 'domain_immersion', 'FinCore', 'Finsoft', 5, 6, true, 'Ledger, account and transaction engineering; data integrity and idempotency', (SELECT id FROM public.users WHERE email = 'fin.core@bluespacefintechacademy.com')),
  ((SELECT id FROM public.cohorts WHERE name = 'Cohort 1 - December 2026'), 'FinOps: Reconciliation and Reporting Pipeline', 'domain_immersion', 'FinOps', 'Finops', 5, 6, true, 'Automate reconciliation and reporting pipelines; operational tooling', (SELECT id FROM public.users WHERE email = 'finops.domain@bluespacefintechacademy.com')),
  ((SELECT id FROM public.cohorts WHERE name = 'Cohort 1 - December 2026'), 'FaaS: Partner-Ready APIs', 'domain_immersion', 'FaaS', 'Finsoft', 4, 4, true, 'Design and build partner-ready APIs and services; versioning, security, onboarding flows', (SELECT id FROM public.users WHERE email = 'faas.domain@bluespacefintechacademy.com')),
  ((SELECT id FROM public.cohorts WHERE name = 'Cohort 1 - December 2026'), 'FinInfra: CI/CD, Cloud and Observability', 'domain_immersion', 'FinInfra', 'Finsoft', 7, 8, true, 'CI/CD, cloud, security and observability as code; resilience', (SELECT id FROM public.users WHERE email = 'fininfra.domain@bluespacefintechacademy.com'));

-- Insert lessons with video/audio content
INSERT INTO public.lessons (module_id, title, type, duration_minutes, content_url, video_url, audio_url, thumbnail_url, caption_url, is_required, order_index, created_by) VALUES
  -- Foundations: Fintech and Payments Fundamentals
  ((SELECT id FROM public.modules WHERE title = 'Fintech and Payments Fundamentals'), 'Introduction to Fintech', 'video', 45, NULL, '/videos/intro-fintech.mp4', NULL, '/thumbnails/intro-fintech.jpg', NULL, true, 1, (SELECT id FROM public.users WHERE email = 'academy.lead@bluespacefintechacademy.com')),
  ((SELECT id FROM public.modules WHERE title = 'Fintech and Payments Fundamentals'), 'Money Movement and Payments', 'video', 60, NULL, '/videos/money-movement.mp4', NULL, '/thumbnails/money-movement.jpg', NULL, true, 2, (SELECT id FROM public.users WHERE email = 'academy.lead@bluespacefintechacademy.com')),
  ((SELECT id FROM public.modules WHERE title = 'Fintech and Payments Fundamentals'), 'Guided Lab: Payment Flow', 'lab', 90, NULL, NULL, NULL, NULL, NULL, true, 3, (SELECT id FROM public.users WHERE email = 'academy.lead@bluespacefintechacademy.com')),
  -- Domain Immersion: FinCore
  ((SELECT id FROM public.modules WHERE title = 'FinCore: Ledger and Transaction Engineering'), 'FinCore Ledger Concepts', 'video', 55, NULL, '/videos/fincore-ledger.mp4', NULL, '/thumbnails/fincore-ledger.jpg', NULL, true, 1, (SELECT id FROM public.users WHERE email = 'fin.core@bluespacefintechacademy.com')),
  ((SELECT id FROM public.modules WHERE title = 'FinCore: Ledger and Transaction Engineering'), 'Double-Entry Postings Lab', 'lab', 120, NULL, NULL, NULL, NULL, NULL, true, 2, (SELECT id FROM public.users WHERE email = 'fin.core@bluespacefintechacademy.com')),
  -- Domain Immersion: FinOps
  ((SELECT id FROM public.modules WHERE title = 'FinOps: Reconciliation and Reporting Pipeline'), 'FinCore Ledger Concepts (Audio)', 'audio', 35, NULL, NULL, '/audio/fincore-ledger.mp3', NULL, NULL, true, 1, (SELECT id FROM public.users WHERE email = 'finops.domain@bluespacefintechacademy.com')),
  ((SELECT id FROM public.modules WHERE title = 'FinOps: Reconciliation and Reporting Pipeline'), 'Reconciliation Pipeline Lab', 'lab', 120, NULL, NULL, NULL, NULL, NULL, true, 2, (SELECT id FROM public.users WHERE email = 'finops.domain@bluespacefintechacademy.com')),
  -- Domain Immersion: FaaS
  ((SELECT id FROM public.modules WHERE title = 'FaaS: Partner-Ready APIs'), 'FaaS API Design Overview', 'video', 55, NULL, '/videos/faas-api-design.mp4', NULL, '/thumbnails/faas-api-design.jpg', NULL, true, 1, (SELECT id FROM public.users WHERE email = 'faas.domain@bluespacefintechacademy.com')),
  ((SELECT id FROM public.modules WHERE title = 'FaaS: Partner-Ready APIs'), 'Partner API Lab', 'lab', 120, NULL, NULL, NULL, NULL, NULL, true, 2, (SELECT id FROM public.users WHERE email = 'faas.domain@bluespacefintechacademy.com'));

-- Insert assessments
INSERT INTO public.assessments (module_id, title, type, weight, max_score, pass_mark, due_date, is_published, created_by) VALUES
  ((SELECT id FROM public.modules WHERE title = 'Fintech and Payments Fundamentals'), 'Foundations Assessment', 'quiz', 25, 100, 70, '2026-12-20', true, (SELECT id FROM public.users WHERE email = 'academy.lead@bluespacefintechacademy.com')),
  ((SELECT id FROM public.modules WHERE title = 'FinCore: Ledger and Transaction Engineering'), 'FinCore Domain Assessment', 'domain_assessment', 25, 100, 70, '2027-01-15', true, (SELECT id FROM public.users WHERE email = 'fin.core@bluespacefintechacademy.com')),
  ((SELECT id FROM public.modules WHERE title = 'FinOps: Reconciliation and Reporting Pipeline'), 'FinOps Domain Assessment', 'domain_assessment', 25, 100, 70, '2027-01-15', true, (SELECT id FROM public.users WHERE email = 'finops.domain@bluespacefintechacademy.com')),
  ((SELECT id FROM public.modules WHERE title = 'FaaS: Partner-Ready APIs'), 'FaaS Domain Assessment', 'domain_assessment', 25, 100, 70, '2027-01-15', true, (SELECT id FROM public.users WHERE email = 'faas.domain@bluespacefintechacademy.com')),
  ((SELECT id FROM public.modules WHERE title = 'FinInfra: CI/CD, Cloud and Observability'), 'FinInfra Domain Assessment', 'domain_assessment', 25, 100, 70, '2027-01-15', true, (SELECT id FROM public.users WHERE email = 'fininfra.domain@bluespacefintechacademy.com'));

-- Insert use cases
INSERT INTO public.use_cases (cohort_id, domain, title, description, stakeholder, sandbox_access, anonymised_data, status, created_by) VALUES
  ((SELECT id FROM public.cohorts WHERE name = 'Cohort 1 - December 2026'), 'FinCore', 'FinCore Ledger Integration', 'Implement a simple double-entry ledger with balance checks for partner transactions', 'BlueSPACE Engineering Team', true, true, 'qualified', (SELECT id FROM public.users WHERE email = 'academy.lead@bluespacefintechacademy.com')),
  ((SELECT id FROM public.cohorts WHERE name = 'Cohort 1 - December 2026'), 'FaaS', 'FaaS Partner API Onboarding', 'Design and build partner-ready APIs and services for fintech partners', 'Code Partner - FinTech Solutions', false, true, 'proposed', (SELECT id FROM public.users WHERE email = 'academy.lead@bluespacefintechacademy.com')),
  ((SELECT id FROM public.cohorts WHERE name = 'Cohort 1 - December 2026'), 'FinOps', 'FinOps Automated Reconciliation', 'Automate reconciliation and reporting pipelines for partner transactions', 'Bank Partner - Ghana', false, true, 'proposed', (SELECT id FROM public.users WHERE email = 'academy.lead@bluespacefintechacademy.com'));

-- Assign Squad Alpha to FinCore use case
UPDATE public.use_cases SET squad_id = (SELECT id FROM public.squads WHERE name = 'Squad Alpha'), status = 'assigned'
WHERE title = 'FinCore Ledger Integration';

-- Insert initial lab submissions (for demo)
INSERT INTO public.submissions (user_id, lab_id, squad_id, status, content_url, score, feedback, submitted_at) VALUES
  ((SELECT id FROM public.users WHERE email = 'ada.okonkwo@bluespacefintechacademy.com'),
   (SELECT id FROM public.labs WHERE title = 'Guided Lab: Payment Flow'),
   (SELECT id FROM public.squads WHERE name = 'Squad Alpha'),
   'graded',
   'https://github.com/ada-okonkwo/payment-flow-lab',
   87,
   'Well implemented. Consider adding idempotency checks.',
   '2026-11-15 14:30:00+00');

-- Insert initial lab progress
INSERT INTO public.lesson_progress (user_id, lesson_id, watch_time_seconds, completion_percentage, is_completed, last_position_seconds) VALUES
  ((SELECT id FROM public.users WHERE email = 'ada.okonkwo@bluespacefintechacademy.com'),
   (SELECT id FROM public.lessons WHERE title = 'Introduction to Fintech'),
   2700,
   100,
   true,
   2700),
  ((SELECT id FROM public.users WHERE email = 'ada.okonkwo@bluespacefintechacademy.com'),
   (SELECT id FROM public.lessons WHERE title = 'Money Movement and Payments'),
   1800,
   50,
   false,
   1800);

-- Insert initial certification for Ada
INSERT INTO public.certifications (user_id, cohort_id, track, status, final_grade, attendance_percentage, skills_profile, created_at) VALUES
  ((SELECT id FROM public.users WHERE email = 'ada.okonkwo@bluespacefintechacademy.com'),
   (SELECT id FROM public.cohorts WHERE name = 'Cohort 1 - December 2026'),
   'Finsoft',
   'certified',
   87.5,
   95.0,
   '{"skills": ["API Design", "Ledger Engineering", "CI/CD"], "domains": ["FaaS", "FinCore"], "rolePreferences": ["Technical Specialist"]}',
   '2027-04-15 10:00:00+00');

-- Insert initial placement
INSERT INTO public.placements (certification_id, user_id, role, project_id, start_date, status) VALUES
  ((SELECT id FROM public.certifications WHERE user_id = (SELECT id FROM public.users WHERE email = 'ada.okonkwo@bluespacefintechacademy.com')),
   (SELECT id FROM public.users WHERE email = 'ada.okonkwo@bluespacefintechacademy.com'),
   'Technical Specialist',
   'fin-core-ledger-integration',
   '2027-04-16',
   'placed');
