-- 12_trim_demo_accounts.sql
--
-- Apply after 11_partner_profile_update.sql.
--
-- Keep exactly one demo login per role (Student, Instructor, Administrator,
-- Partner) and remove the extra seeded demo accounts. The extra accounts are
-- demo fixtures, so their dependent demo rows (enrolments, submissions,
-- progress, certificates, notifications, placements, bookings, assignments)
-- are removed with them.
--
-- Squad 1's lead was one of the removed students; it is reassigned to the
-- remaining student so the squad and its enrolment stay valid.
--
-- Re-runnable: once the accounts are gone, every statement is a no-op.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Accounts to remove
-- ---------------------------------------------------------------------------
--
-- Explicit emails, not "everything that is not on the keep-list", so a real
-- account created later can never be swept up by re-running this file.

CREATE TEMP TABLE doomed_users ON COMMIT DROP AS
SELECT id, email
FROM public.users
WHERE email IN (
  'ada.okonkwo@bluespacefintechacademy.com',
  'kwame.asante@bluespacefintechacademy.com',
  'zainab.yusuf@bluespacefintechacademy.com',
  'emeka.ndiaye@bluespacefintechacademy.com',
  'fatima.diallo@bluespacefintechacademy.com',
  'faas.domain@bluespacefintechacademy.com',
  'finops.domain@bluespacefintechacademy.com'
);

-- ---------------------------------------------------------------------------
-- 2. Reassign the squad lead before deleting the old lead
-- ---------------------------------------------------------------------------

UPDATE public.squads
SET squad_lead_id = (
  SELECT id FROM public.users
  WHERE email = 'student@bluespacefintechacademy.com'
)
WHERE squad_lead_id IN (SELECT id FROM doomed_users);

-- ---------------------------------------------------------------------------
-- 3. Clear NO ACTION references that should survive
-- ---------------------------------------------------------------------------
--
-- A sprint deliverable can outlive the reviewer. Keep the deliverable and drop
-- the attribution rather than deleting work submitted by a retained student.

UPDATE public.sprint_deliverables
SET reviewed_by = NULL
WHERE reviewed_by IN (SELECT id FROM doomed_users);

-- Applications are admissions history, not demo progress. Keep the row if an
-- applicant account is ever removed; the FK is ON DELETE SET NULL.

UPDATE public.academy_applications
SET user_id = NULL
WHERE user_id IN (SELECT id FROM doomed_users);

UPDATE public.academy_applications
SET reviewed_by = NULL
WHERE reviewed_by IN (SELECT id FROM doomed_users);

-- ---------------------------------------------------------------------------
-- 4. Remove user-owned demo data (NO ACTION foreign keys)
-- ---------------------------------------------------------------------------

DELETE FROM public.mentor_evaluations
WHERE mentor_id IN (SELECT id FROM doomed_users)
   OR user_id IN (SELECT id FROM doomed_users);

DELETE FROM public.sprint_deliverables
WHERE user_id IN (SELECT id FROM doomed_users);

DELETE FROM public.lesson_progress
WHERE user_id IN (SELECT id FROM doomed_users);

DELETE FROM public.enrolments
WHERE user_id IN (SELECT id FROM doomed_users);

-- Placements reference certifications, so remove them first.
DELETE FROM public.placements
WHERE user_id IN (SELECT id FROM doomed_users);

DELETE FROM public.certifications
WHERE user_id IN (SELECT id FROM doomed_users);

DELETE FROM public.notifications
WHERE user_id IN (SELECT id FROM doomed_users);

-- ---------------------------------------------------------------------------
-- 5. Delete the accounts
-- ---------------------------------------------------------------------------
--
-- Remaining references are ON DELETE CASCADE (submissions, clinic bookings,
-- attendance, instructor assignments, peer reviews, skills profiles, partner
-- enrolments/progress, tokens, password resets) or ON DELETE SET NULL
-- (submission grader).

DELETE FROM public.users
WHERE id IN (SELECT id FROM doomed_users);

COMMIT;
