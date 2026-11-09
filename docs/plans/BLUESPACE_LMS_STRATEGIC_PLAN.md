# BlueSPACE Fintech Academy LMS — Strategic Conceptualisation & Architectural Plan

**Version:** 1.0 (draft for alignment)
**Prepared for:** BlueSPACE Fintech Academy — Intern & Fellow Learning Platform
**Source reference:** BlueSPACE HR System design system (`BlueSPACE HR System/DESIGN.md`, `tailwind.config.js`, `index.css`, UI component library)
**Academy framework:** BlueSPACE Fintech Academy Framework v1.0 (27 October 2026)

---

## Executive Summary

This document establishes the foundational design framework and architectural plan for the BlueSPACE Fintech Academy Learning Management System (LMS). The LMS adapts the existing BlueSPACE HR System design language to an educational context, serving Students (Finsoft & Finops Fellows), Academics/Instructors (Domain leads, Mentors, Track leads), Partner organisation members, and Administrators (Academy team, Cohort coordinator, Admissions, Placement).

The platform supports the academy's four-stage learning framework — **Foundations → Domain Immersion → Live Projects → Certification** — across four domains (**FaaS, FinCore, FinOps, FinInfra**) and two fellowships (**Finsoft, Finops**), with quarterly intakes beginning December 2026.

---

## 1. UI/UX Alignment: Adapting the Bluespace HR Design Language

### 1.1 Design System Inheritance

The LMS will adopt the BlueSPACE HR System design system wholesale, with educational-context extensions. All existing design tokens, component behaviours, and accessibility standards carry forward unchanged.

| Design Token | Bluespace HR Value | LMS Usage |
|---|---|---|
| Primary brand | `#0000ff` (brand-500/600) | Primary actions, active nav, CTAs, certification accents |
| Deep gray | `#0f172a` (deep-500/600) | Body text, backgrounds, borders, sidebar |
| Background | `bg-gray-50` | Page backgrounds, light card fills |
| Typography | Manrope, system-ui, sans-serif | All UI text; weights 200–800 for hierarchy |
| Spacing | 4px grid (Tailwind default) | All layout, form, and component spacing |
| Border radius | `rounded-md` (6px) inputs; `rounded-lg` (8px) cards | Forms, cards, badges, avatars |
| Focus ring | 2px ring brand-500, offset-1 | All interactive inputs and buttons |
| Motion | ease-out-expo; 150/200/250ms | Page transitions, modal open/close, progress animations |

### 1.2 Typography Adaptation

| Scale | HR Usage | LMS Adaptation |
|---|---|---|
| Display (3xl) | Main headers/logos | Academy landing hero, certification certificates |
| Section header (xl–2xl) | Page titles | Module headers, domain section titles, dashboard widgets |
| Component header (lg–xl) | Card titles | Lesson titles, lab deliverable headers, sprint cards |
| Body (base–sm) | General text | Reading content, instructions, mentor feedback |
| Label/caption (xs–sm) | Form labels | Module metadata, domain tags, assessment weights |
| Helper text (xs) | Form helper text | Lesson durations, credit values, prerequisite notes |

**Labels:** Uppercase, `tracking-wider`, `font-semibold`, 12px, brand-500 color — carried over for form consistency.

### 1.3 Color Palette Extensions for Education

The HR system defines semantic colors (success/warning/error/info) but notes they are "to be added as needed." The LMS requires a richer semantic layer:

**Domain colours** (applied to modules, labs, progress indicators):
- FaaS — indigo/violet (API & service boundary)
- FinCore — emerald/green (ledger integrity, correctness)
- FinOps — amber/orange (operations, settlement, exceptions)
- FinInfra — slate/blue-gray (platform, infrastructure, resilience)

**Assessment & status colours** (extending Badge.jsx pattern):
- Pass — `bg-emerald-50 text-emerald-700`
- In progress — `bg-amber-50 text-amber-700`
- Remediation — `bg-amber-100 text-amber-800`
- Fail — `bg-red-50 text-red-700`
- Certified — `bg-indigo-50 text-indigo-700`

**Role colours** (for user avatars, sidebar grouping):
- Student/Fellow — brand blue
- Instructor/Mentor — emerald
- Administrator — slate

### 1.4 Component Adaptations

Existing HR components map directly to LMS needs:

| HR Component | LMS Adaptation |
|---|---|
| `Button` (primary/secondary/outline/danger/ghost) | Enroll, Start Lab, Submit Assessment, Certify, Place Fellow |
| `Card` / `CardHeader` / `CardBody` | Module cards, lab deliverable cards, stat cards, announcement cards |
| `Badge` / `statusBadge` | Domain tags, assessment status, track labels, certification level |
| `Input` / `Select` | Application form, enrolment fields, grading inputs, search filters |
| `Modal` | Capstone submission, panel review, mentor clinic booking, placement matching |
| `StatCard` (Dashboard) | Completion %, domain progress, squad health, placement pipeline |

**New LMS-specific components (following the same patterns):**
- `ProgressBar` — module completion, stage progress, attendance tracking (uses brand-600 fill, gray-100 track, rounded-full)
- `LessonCard` — clickable card with icon, title, duration, status badge, "Start/Resume" CTA
- `SquadCard` — avatar stack (5–7 Fellows), squad lead indicator, sprint progress
- `AssessmentCard` — weight, due date, score, pass/fail badge, remediation flag
- `DomainTimeline` — horizontal stage tracker (Foundations → Domain Immersion → Live Projects → Certification)

### 1.5 Navigation & Layout Adaptation

**Desktop layout** (inherited from `AppLayout.jsx` + `Sidebar.jsx`):
- Fixed left sidebar (`w-60`, `bg-deep-600`), role-grouped nav items
- Sticky header (`h-14`) with notifications bell, user avatar, role label
- Main content area (`flex-1`, `lg:pl-60`, `px-4 lg:px-6`)

**Role-based sidebar groups** (replacing Staff/Management with Student/Instructor/Admin; partner organisation access is an additional relationship and permission set):

| Role | Nav Group | Key Items |
|---|---|---|
| Student | My Learning | Dashboard, My Courses, My Squad, Labs, Progress, Certificates |
| Instructor | Teaching | My Modules, Labs to Review, Squad Mentor Clinics, Grading, Announcements |
| Admin | Academy | Cohorts, Enrolments, Curriculum, Use Cases, Placement, Reports, System Logs |

Partner members see a Partner workspace only when they belong to an approved partner organisation and have the relevant organisation permission. A person may also hold an Instructor role; the organisation relationship and the person's teaching role are distinct.

**Mobile layout** (inherited): Bottom tab bar with 4 primary items + "More" sheet; primary CTA (e.g., "Start Lab") highlighted with brand-600 circular badge.

### 1.6 Accessibility & Responsiveness

All WCAG 2.1 AA standards from `DESIGN.md` apply:
- 4.5:1 contrast ratio for text, 3:1 for UI components
- 44×44px minimum touch targets
- Keyboard navigation with visible focus indicators (2px brand-600)
- `prefers-reduced-motion` respected (animations reduced to 0.01ms)
- Mobile-first responsive grid; tablet/desktop breakpoints via Tailwind `md:`/`lg:`

---

## 2. Core Functional Modules

### 2.1 Student Enrolment & Onboarding
- Online application form (track selection: Finsoft/Finops; intake selection; domain interests)
- Eligibility screening and track assessment routing
- Acceptance, learning agreement, tool setup (Git, sandbox access)
- Squad allocation (5–7 Fellows, 3–4 Finsoft + 2–3 Finops, mixed-track)
- Orientation Week 0: kickoff, tools, squad formation

### 2.2 Curriculum Management
- **Four-stage framework:** Foundations (Weeks 1–3), Domain Immersion (Weeks 4–8), Live Projects (Weeks 9–14), Certification (Weeks 15–16)
- **Four domains:** FaaS, FinCore, FinOps, FinInfra — each with concept session, Factory demonstration, guided lab, short assessment
- **Track-specific content:** Finsoft bootcamp (APIs, Git, cloud, secure coding) vs Finops bootcamp (reconciliation, reporting, BI tooling)
- Module lifecycle: draft → published → archived; versioning per cohort

### 2.3 Course Delivery
- Live instruction sessions (~3 hours/week) with recording
- Guided lab sessions (~3 hours/week) with mentor support
- Self-paced learning (~4–6 hours/week): readings, exercises, squad tasks
- Optional mentor clinics (1 hour/week)
- Squad stand-ups (2–3×/week during project stage)
- Sandbox access for labs and live use cases

### 2.4 Grading & Assessment System
Assessment weights per academy framework (Section 2.5):
| Component | Weight | LMS Tracking |
|---|---|---|
| Attendance and participation | 10% | Session check-ins, clinic attendance, stand-up participation |
| Domain labs and assessments | 25% | Lab submissions, domain quiz scores, portfolio |
| Live project contribution | 40% | Sprint deliverables, peer review, mentor evaluation |
| Capstone and panel review | 25% | Track deliverable demo, panel rubric scoring |

Pass mark: configurable % + minimum attendance %. Remediation plan or deferred cohort for non-passing Fellows.

### 2.5 Progress Tracking & Reporting
- Per-Fellow dashboard: domain completion %, stage progress, upcoming labs/assessments, squad status
- Per-squad dashboard: collective progress, blocker flags, mentor notes
- Per-cohort admin dashboard: enrolment, attendance, assessment completion, certification rate
- Bank/trainee reporting (Section 9.6): enrolment confirmation, progress report (mid-programme), project report, completion report

### 2.6 Live Project Management
- Use case pipeline: real Factory problems qualified per cohort (fit, scope, confidentiality)
- Squad sprints: three 2-week sprints per live use case
- Rotating roles: Squad Lead (PM), UAT Lead, Technical Specialist, Operations/Field Lead
- UAT cycles in sprints 2 and 3 against stakeholder requirements
- Evidence capture: work log, deliverables, peer review scores, mentor evaluation

### 2.7 Certification & Placement
- Capstone demo: track deliverable (Finsoft: working service; Finops: automated operating process) + squad outcome
- Panel review: BlueSPACE domain leads + optional code partner; rubric-based scoring
- Skills profile: skills, domains, role preferences for placement matching
- Certification: BlueSPACE Fellow certificate (Finsoft or Finops track)
- Placement matching: Project Manager, Field Lead, UAT, Technical Specialist roles; 30/60/90-day check-ins

### 2.8 Administration
- Cohort management: quarterly intakes, capacity caps, overlapping cohort support (two cohorts concurrently for part of the year)
- Mentor roster: Factory practitioners, clinic scheduling, squad assignment
- Use case pipeline: stakeholder intake, confidentiality terms, sandbox/anonymised data provisioning
- Partner management: code partner contributions, placement destinations, campaign assets
- Admissions: application review, track assessment scoring, interview scheduling, offer/waitlist/decline decisions

### 2.9 Partner Organisations & External Teaching Contributors
- Partner is an organisation relationship, not a standalone person role. An organisation may contribute courses or learning materials, instructors/tutors, tools or sandbox access, live use cases, and placement opportunities.
- A partner representative registers as an individual, creates a partner organisation request or accepts an invitation to an existing organisation, and receives organisation-scoped permissions after approval.
- Partner organisation members can submit or manage that organisation's course content and invite or nominate instructors/tutors. They do not automatically receive teaching, grading, or access to student records.
- Individuals who teach or mentor must have an Instructor role and an assignment to the relevant course, cohort, or squad. A partner representative may also be an Instructor, but receives teaching access only through that separate role and assignment.
- Partner-submitted courses remain unpublished until an authorised Academy administrator approves them. Academy staff retain control of curriculum inclusion, learner access, and cohort assignment.
- The platform remains an internal, free academy rather than a paid course marketplace; partner contribution does not enable sales, fees, or instructor payouts.

---

## 3. User Personas & Workflows

### 3.1 Student / Fellow

**Profile:** Finsoft Fellow (developer/DevOps) or Finops Fellow (finance operations professional), enrolled in a quarterly cohort.

**Key workflows:**
1. **Apply & Onboard** → Submit application → Accept offer → Complete Week 0 orientation → Assigned to mixed-track squad
2. **Learn** → Dashboard shows current stage → Attend live sessions → Complete labs → Submit assessments → View domain progress
3. **Build** → Squad assigned to live use case → Sprint planning → Daily/thrice-weekly stand-ups → Mentor clinics → UAT cycles → Sprint reviews/retrospectives
4. **Certify** → Capstone submission → Panel review → Receive certificate + skills profile → Enter placement matching
5. **Alumni** → Access continued learning → Referral channel → Ambassador role in future campaigns

**Primary screens:** My Dashboard, Course Player, Lab Workspace, Squad View, Progress Tracker, Certificate Wallet.

### 3.2 Academics / Instructors

**Sub-roles:** Academy Team Lead, Finsoft Track Lead, Finops Track Lead, Domain Leads (FaaS/FinCore/FinOps/FinInfra), Mentors, Cohort Coordinator, Admissions Panel, Placement Coordinator.

**Key workflows:**

*Domain Lead / Track Lead:*
- Publish and version domain modules, labs, assessments
- Run concept sessions and demonstrations
- Review lab submissions and domain assessments
- Participate in certification panel reviews

*Mentor:*
- Support assigned squads during live project stage
- Run optional mentor clinics (1 hour/week)
- Provide sprint feedback and mid-sprint clinic input
- Evaluate project contribution for grading

*Cohort Coordinator:*
- Manage scheduling, onboarding, attendance tracking
- Learner support and communications
- Early outreach to absent Fellows (online drop-off mitigation)

*Admissions Panel:*
- Review applications, track assessments, interviews
- Make offer/waitlist/decline decisions per cohort

*Placement Coordinator:*
- Maintain skills profiles from certification
- Match Fellows to project roles (PM, Field Lead, UAT, Technical Specialist)
- Conduct 30/60/90-day placement check-ins

**Primary screens:** Module Builder, Lab Reviewer, Squad Mentor View, Grading Console, Certification Panel, Placement Matcher.

### 3.3 Administrator

**Profile:** Academy operations staff managing cohorts, partner organisations, reporting, and platform configuration.

**Key workflows:**
- Create and configure cohorts (intake dates, capacity, track balance)
- Manage enrolment: confirm trainees, assign tracks, generate progress reports for bank partners
- Maintain use case pipeline: qualify use cases per cohort, set confidentiality terms
- Approve and manage partner organisations, their representatives, contributions, and organisation-scoped permissions
- Review partner-submitted courses before publication; assign approved instructors to courses/cohorts
- Manage partner contributions: tools, sandbox access, guest mentors, live use cases, and placement destinations
- Generate reports: enrolment confirmation, progress (mid-programme), project, completion
- Monitor system: admin logs, platform health, data safeguards for live use cases

**Primary screens:** Admin Dashboard, Cohort Management, Enrolment Console, Use Case Pipeline, Partner Portal, Reports & Analytics, System Logs.

---

## 4. Tracking & Analytics Strategy

### 4.1 Progress Tracking Within UI Constraints

The LMS inherits the HR system's `StatCard` pattern and card-based dashboard layout. Progress tracking is surfaced through:

**Stat cards (Dashboard top row):**
- Overall completion % (stage progress)
- Attendance % (sessions + clinics)
- Labs completed / total
- Current grade / weighted score
- Squad health indicator

**Progress bars (card-based, inherited from Leave Balance pattern):**
- Per-domain progress (FaaS, FinCore, FinOps, FinInfra) with domain colour fills
- Per-stage progress (Foundations → Immersion → Projects → Certification)
- Assessment weight breakdown (10%/25%/40%/25%)

**Badges (inherited from `Badge.jsx` semantic variants):**
- Domain tags on module cards
- Assessment status: Pass / In Progress / Remediation / Fail
- Certification level: Certified / In Progress / Not Yet Certified
- Role badges: Squad Lead, UAT Lead, Technical Specialist, Field Lead

**Activity lists (inherited from Recent Leave Requests / Pending Approvals patterns):**
- Upcoming labs and assessments with due dates
- Squad stand-up reminders
- Mentor clinic bookings
- Peer review pending items

### 4.2 Data Tracking Architecture

| Data Category | What Is Tracked | UI Surface | Frequency |
|---|---|---|---|
| Attendance | Session check-ins, clinic attendance, stand-up participation | Attendance % stat card; cohort admin report | Per session |
| Participation | Squad contributions, forum posts, peer reviews | Squad health badge; mentor notes | Weekly |
| Labs & Assessments | Submission status, scores, pass/fail, remediation flags | Domain progress bar; assessment card | Per module |
| Project Contribution | Sprint deliverables, peer review scores, mentor evaluation | Squad dashboard; project contribution record | Per sprint |
| Capstone & Panel | Rubric scores, panel decision, certification result | Certificate wallet; skills profile | End of programme |
| Placement | Role match, start date, 30/60/90-day check-ins | Placement coordinator console | Post-certification |

### 4.3 Reporting Templates (aligned to academy framework)

**For Fellows (self-view):**
- Progress report: stage completion, domain scores, upcoming deadlines, squad status

**For Banks / Partners (Section 9.6 reporting):**
| Report | Content | Timing |
|---|---|---|
| Enrolment confirmation | Trainees, track, cohort, start date | Before kickoff |
| Progress report | Attendance, domain assessments, mentor notes | Mid-programme |
| Project report | Use case, squad outcome, individual contribution | After Live Projects stage |
| Completion report | Certification result, skills profile, placement preferences | At certification |

**For Academy Administration:**
- Cohort health: enrolment by track, attendance trends, drop-off risk flags
- Assessment analytics: pass rates per domain, per track, per cohort
- Placement analytics: placement rate, time-to-placement, role distribution
- Use case pipeline: qualified use cases per domain, stakeholder coverage

### 4.4 Analytics Visualisation (UI-Constrained)

All visualisations use existing component patterns — no new charting libraries required initially:

- **Stat cards** for headline metrics (completion %, attendance, pass rate)
- **Progress bars** for domain/stage completion (color-coded by domain)
- **Badge grids** for assessment status and certification state
- **Tables** for recent activity, pending reviews, squad rosters
- **Cards** for upcoming deadlines, mentor clinic bookings, announcement feeds

If advanced visualisation is needed later (cohort comparison, funnel analysis), it can be added within card containers using lightweight SVG or a charting library, respecting the `shadow-sm`, `border-gray-100`, `rounded-lg` card standard.

### 4.5 Data Safeguards (per academy risk register)

- Live use cases involving real systems/data: confidentiality terms before cohort start
- Sandbox or anonymised data unless specific agreement allows otherwise
- Bank of Ghana and Ghana Data Protection Act (Act 843) compliance for bank trainee data
- Trainee consent for application/progress data sharing with banks
- Role- and organisation-scoped access control: Fellows see their own data; Instructors see only assigned teaching work and learners; partner members see only their organisation and its contributions; Admins see academy data according to administrative permissions

---

## 5. Implementation Readiness

The LMS can be built directly on the BlueSPACE HR System's existing technical foundation:

- **Frontend:** React + Vite + Tailwind CSS (same as HR system)
- **UI component library:** Reuse `Button`, `Card`, `Badge`, `Input`, `Select`, `Modal` from `client/src/components/ui/`
- **Layout:** Reuse `AppLayout`, `Sidebar`, `ProtectedRoute` patterns with role-based nav groups
- **Icons:** `lucide-react` (already used; add education-appropriate icons: `BookOpen`, `GraduationCap`, `Users`, `Activity`, `BarChart3`, `ClipboardList`, `Award`, `Target`)
- **Animations:** `framer-motion` with existing `ease` curves (`[0.23, 1, 0.32, 1]`) and `fade-in`/`scale-in` keyframes
- **Backend/API:** Existing Express + Supabase architecture; extend schema for courses, enrolments, assessments, squads, use cases, certifications
- **Auth:** Existing `AuthContext` extended with person roles (Student, Instructor, Administrator) and separate partner organisation memberships/permissions; do not treat Partner as an interchangeable person role

---

## 6. Next Steps (Post-Alignment)

1. Confirm design token extensions (domain colours, assessment colours) with product stakeholders
2. Define data schema for users and person roles, partner organisations and memberships, course ownership/submission and approval, instructor assignments, enrolments, assessments, squads, use cases, and certifications
3. Prioritise MVP module scope (Foundations stage + one domain + student dashboard)
4. Establish lint/typecheck/test commands for the LMS codebase
5. Schedule detailed implementation planning per functional module

## 7. Approved Product Scope

BlueSPACE LMS is an internal, free academy platform for managing students, instructors,
cohorts, curriculum, live classes, assessments, certification, mentorship, and placement.
It is not a paid course marketplace.

The Version 1 scope includes authentication, role-based access, user and cohort management,
course delivery, progress tracking, labs, quizzes, grading, certificates, announcements,
notifications, reporting, audit logs, live-class scheduling, Google Meet/Calendar integration,
attendance, and secure data access.

The following are explicitly out of scope: shopping carts, checkout, payment gateways,
refunds, coupons, referrals, gifts, waitlists, package sales, currency conversion,
instructor commissions, instructor payouts, earnings, invoices, sales history, and commercial
marketplace ratings/reviews. Student feedback and internal programme evaluation remain in scope.

## 8. V2 Operational Readiness

The V2 foundation extends the internal academy workflow without reintroducing marketplace
commerce. The delivered operational capabilities are:

- persisted student skills profiles for placement matching;
- mentor clinic scheduling, cohort visibility, Meet links, and clinic bookings;
- project sprint deliverables and evidence capture;
- mentor evaluations and peer-review records;
- assessment question and student attempt storage for quiz delivery;
- production RLS for squads, placements, notifications, use cases, sprints, clinics,
  project evidence, skills, peer reviews, and assessment attempts;
- live placement creation, squad member assignment, cohort-targeted live classes, and
  deep-linked lab grading.

Before declaring the platform fully production-complete, the team must still configure and
smoke-test Google OAuth/Calendar/Meet Edge Functions, certificate PDF generation and public
verification, quiz authoring and attempt UI, notification automation, instructor assignment
boundaries, automated RLS tests, dependency remediation, and bundle splitting.
