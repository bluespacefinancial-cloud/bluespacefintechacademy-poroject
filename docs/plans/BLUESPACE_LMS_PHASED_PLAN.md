# BlueSPACE Fintech Academy LMS — Phased Implementation Plan

**Source:** BLUESPACE_LMS_STRATEGIC_PLAN.md
**Approach:** Build incrementally, one phase at a time, reusing the Bluespace HR System design system and technical stack (React + Vite + Tailwind + Supabase/Express).

---

## Phase 0 — Foundation & Design System

**Goal:** Establish the LMS codebase, design tokens, and reusable component library before any feature work.

**Scope:**
- Scaffold React + Vite + Tailwind project mirroring HR System structure
- Port design tokens from HR `DESIGN.md` and `tailwind.config.js` (brand blue, deep gray, Manrope typography, 4px grid, motion curves)
- Add LMS-specific tokens: domain colours (FaaS/FinCore/FinOps/FinInfra), assessment colours (pass/in-progress/remediation/fail/certified), role colours
- Build core UI components: `Button`, `Card`, `Badge`, `Input`, `Select`, `Modal`, `ProgressBar`, `StatCard`, `LessonCard`, `SquadCard`
- Set up linting, typechecking, and test tooling
- Create design system documentation page

**Deliverables:**
- Working dev server with design system storybook/page
- Component library ready for feature teams
- Design token reference doc

**Dependencies:** None (start here)

---

## Phase 1 — Authentication & Role-Based Layout

**Goal:** Secure entry point, person roles, partner organisation membership, and role-aware shell navigation.

**Scope:**
- Extend HR `AuthContext` with person roles: Student, Instructor (Domain Lead / Track Lead / Mentor), Administrator (Academy Team / Cohort Coordinator / Admissions / Placement). Model Partner separately as an organisation and a user's membership with scoped permissions, not as a mutually exclusive person role.
- Registration flow lets a person select their intended participation: student, instructor/tutor, or partner representative. A person may have multiple person roles and may also belong to a partner organisation.
- Partner representative can request a new organisation or accept an invitation to an existing organisation; organisation access is pending until academy approval.
- Partner membership management: invite/remove organisation members and assign scoped capabilities such as submitting course content or managing organisation details.
- Login page (adapt HR `Login.jsx`) with role-aware redirect based on the user's active role or organisation workspace; do not let login role selection grant privileges.
- Role-based sidebar nav groups (Student: My Learning; Instructor: Teaching; Admin: Academy; approved partner members: Partner workspace)
- Sticky header with notifications, user avatar, role label
- Protected routes (`ProtectedRoute` pattern from HR system)
- Logout and session handling

**Deliverables:**
- Registration and login with role/organisation-aware redirects
- Student, Instructor, Admin, and approved Partner workspace navigation
- Organisation approval and membership permission boundaries
- Auth guards on all routes

**Dependencies:** Phase 0

---

## Phase 2 — Student Module (MVP: Foundations + One Domain)

**Goal:** Fellow can enrol, view their learning path, complete labs, and track progress.

**Scope:**
- Student dashboard with stat cards (completion %, attendance, labs done, current grade)
- Course player: module list, lesson cards with duration/status, "Start/Resume" CTA
- Lab workspace: guided lab instructions, submission upload, status badge
- Progress tracker: per-domain progress bars, stage progress (Foundations → Immersion → Projects → Certification)
- Assessment cards: weight, due date, score, pass/fail badge
- Squad view: avatar squad roster, squad lead indicator
- Certificate wallet (placeholder for Phase 7)

**Deliverables:**
- End-to-end student flow for one domain (e.g., FinCore) in Foundations stage
- Progress tracking UI with domain colour coding

**Dependencies:** Phase 1

---

## Phase 3 — Instructor / Academic Module

**Goal:** Assigned instructors can teach, review labs, grade assessments, and mentor squads; partner organisations can contribute course content through an approval workflow.

**Scope:**
- Module builder: create/edit domain modules, labs, assessments, set weights
- Lab reviewer: view submissions, leave feedback, mark pass/remediation/fail
- Grading console: input scores per assessment component (attendance 10%, labs 25%, project 40%, capstone 25%)
- Squad mentor view: assigned squads, stand-up notes, clinic bookings, blocker flags
- Announcements: post to cohort, notify students
- Mentor clinic scheduling (1 hour/week optional)
- Assign instructors to approved courses, cohorts, and squads; enforce assignment-scoped teaching and grading access
- Partner-submitted course workflow: draft/submission, academy review, approval or return for revision, publication by authorised academy staff

**Deliverables:**
- Full instructor workflow for one domain module
- Grading input with weight validation

**Dependencies:** Phase 1, Phase 2 (student data model)

---

## Phase 4 — Administrator Module

**Goal:** Admins manage cohorts, enrolments, partner organisations and their contributions, and reporting.

**Scope:**
- Cohort management: create quarterly cohorts, set dates/capacity/track balance
- Enrolment console: confirm trainees, assign tracks, generate enrolment confirmation reports
- Use case pipeline: qualify live use cases per domain, set confidentiality terms, sandbox/anonymised data flags
- Partner organisation administration: review organisation requests, manage representatives and permissions, track contributions and placement destinations
- Review and approve partner-submitted courses before publication; retain academy control of curriculum inclusion and learner access
- Reports: enrolment confirmation, mid-programme progress, project, completion (per Section 9.6 of academy framework)
- System logs and platform health

**Deliverables:**
- Cohort creation and enrolment flow
- Four standard reports (enrolment, progress, project, completion)

**Dependencies:** Phase 1, Phase 2 (data models)

---

## Phase 5 — Live Projects & Squad Management

**Goal:** Squads execute live use cases across three 2-week sprints with UAT cycles.

**Scope:**
- Squad formation: 5–7 Fellows (3–4 Finsoft + 2–3 Finops), squad lead assignment
- Sprint management: planning, stand-ups, mid-sprint mentor clinic, sprint review, retrospective
- Rotating roles: Squad Lead (PM), UAT Lead, Technical Specialist, Operations/Field Lead
- UAT cycles in sprints 2 and 3 against stakeholder requirements
- Evidence capture: work log, deliverables, peer review scores, mentor evaluation
- Squad dashboard: collective progress, blocker flags, mentor notes

**Deliverables:**
- One full live project cycle (3 sprints) for one squad
- Project contribution record per Fellow

**Dependencies:** Phase 2 (squads), Phase 3 (mentor), Phase 4 (cohorts/use cases)

---

## Phase 6 — Certification & Placement

**Goal:** Fellows complete capstone, panel review, receive certification, and match to project roles.

**Scope:**
- Capstone submission: track deliverable (Finsoft: working service; Finops: automated operating process) + squad outcome
- Panel review: rubric-based scoring by domain leads + optional code partner
- Skills profile: skills, domains, role preferences
- Certification: BlueSPACE Fellow certificate (Finsoft/Finops track), certificate wallet
- Placement matching: propose matches to project leads, interview scheduling
- Placement roles: Project Manager, Field Lead, UAT, Technical Specialist
- 30/60/90-day placement check-ins

**Deliverables:**
- End-to-end certification flow for one Fellow
- Placement matcher with skills profile

**Dependencies:** Phase 5 (project contribution data)

---

## Phase 7 — Analytics & Reporting Dashboard

**Goal:** Cohort-level and academy-wide data monitoring within UI constraints.

**Scope:**
- Admin analytics dashboard: cohort health (enrolment by track, attendance trends, drop-off risk), assessment pass rates per domain/track/cohort, placement rate and time-to-placement
- Fellow self-view analytics: personal progress trends, domain comparison
- Bank/trainee reports: enrolment confirmation, progress, project, completion (PDF/export)
- Visualisation using existing card/stat/progress-bar patterns (no new charting library in MVP)

**Deliverables:**
- Admin analytics dashboard
- Exportable bank reports

**Dependencies:** Phase 2–6 (all data sources)

---

## Recommended Execution Order

| Phase | Focus | Est. Effort | Prerequisite |
|-------|-------|-------------|--------------|
| 0 | Foundation & Design System | Small | — |
| 1 | Auth & Layout | Small | Phase 0 |
| 2 | Student Module (MVP) | Medium | Phase 1 |
| 3 | Instructor Module | Medium | Phase 1, Phase 2 |
| 4 | Admin Module | Medium | Phase 1, Phase 2 |
| 5 | Live Projects & Squads | Large | Phase 2–4 |
| 6 | Certification & Placement | Medium | Phase 5 |
| 7 | Analytics & Reporting | Medium | Phase 2–6 |

**Suggested starting point:** Phase 0. Confirm design token extensions and scaffold the project before building features.
