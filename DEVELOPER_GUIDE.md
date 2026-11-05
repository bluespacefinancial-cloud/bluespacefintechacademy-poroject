# BlueSPACE Fintech Academy LMS — Developer Guide

Complete technical documentation for developers, operators, and contributors.

---

## 1. System Overview

BlueSPACE Fintech Academy LMS is a learning management system training Finsoft and Finops Fellows on the AI Fintech Factory domains (FaaS, FinCore, FinOps, FinInfra). It provides role-based portals for Students, Instructors, Partners, and Administrators.

**Tech Stack:**
- **Frontend:** React 18 + Vite + Tailwind CSS + shadcn/ui + Framer Motion
- **Backend:** Supabase (PostgreSQL + Auth + Edge Functions + Storage)
- **Auth:** Supabase Auth + custom `public.users` profile table
- **Icons:** Lucide React
- **Notifications:** React Hot Toast
- **Deployment:** Vercel (frontend) + Supabase (backend)

---

## 2. Architecture

```
┌─────────────────┐      HTTPS       ┌──────────────────┐
│   Vercel        │◄─────────────────▶│   Supabase       │
│   (Frontend)    │                  │   (Backend)      │
│                 │                  │                  │
│ React App       │                  │ PostgreSQL 16    │
│ Tailwind CSS    │◀─────────────────│ Supabase Auth    │
│ shadcn/ui       │                  │ Edge Functions   │
│                 │                  │ Storage          │
└─────────────────┘                  └──────────────────┘
```

**Auth model:** Supabase Auth handles credentials (email/password). A separate `public.users` table stores profile metadata (name, role, track, active status). The two are joined by email, not by auth UUID, because `public.users.id` is a bigint while Supabase auth IDs are UUIDs.

**Authorization:** Row Level Security (RLS) on PostgreSQL tables enforces data access. Column-level grants hide secret fields (`password`, `solution_code`, `correct_answer`). Edge functions validate sessions server-side using the service role, then query data through the client (anon) key so RLS applies.

---

## 3. Database Schema & Migrations

All schema and migrations live in `supabase/`.

### Core Tables

| Table | Description |
|-------|-------------|
| `users` | Academy profiles (name, email, type, is_active, partner_id) |
| `cohorts` | Quarterly intakes (Dec 2026, Mar 2027, Jun 2027, Sep 2027) |
| `enrolments` | Links users to cohorts with track and status |
| `squads` | Mixed-track groups within cohorts |
| `modules` | Course modules within the 4-stage framework |
| `lessons` | Individual lessons within modules |
| `labs` | Guided lab assignments (solution_code hidden) |
| `assessments` | Quizzes and domain assessments (correct_answer hidden) |
| `submissions` | Student lab/assessment submissions |
| `lesson_progress` | Per-user lesson completion tracking |
| `use_cases` | Live Factory problems for project stage |
| `sprints` | 2-week sprints within live projects |
| `certifications` | Fellow certification records |
| `placements` | Post-certification project placements |
| `notifications` | In-app notifications |
| `audit_logs` | Admin audit trail |
| `clinics` | Mentor office hours |

### Partner Tables (Migration 011)

| Table | Description |
|-------|-------------|
| `partners` | Partner agencies (pending/approved/suspended) |
| `partner_courses` | Courses created by partners |
| `partner_course_lessons` | Lessons within partner courses |
| `partner_course_enrolments` | Student enrolments in partner courses |
| `partner_course_progress` | Per-user lesson progress in partner courses |

### Migration Order

Apply in this order:
1. `supabase/schema.sql` — Foundation tables, indexes, foreign keys, triggers
2. `001_phase_one_academy.sql` — Live classes, RLS policies
3. `002_academy_operations.sql` — Auth bridge (`auth_user_id`), announcements
4. `003_student_squad_visibility.sql` — Squad roster visibility (recursion fix in 010)
5. `004_staff_learning_monitoring.sql` — Staff read-only monitoring
6. `005_production_operations.sql` — Squad, placement, notification security
7. `006_academy_v2_operations.sql` — Clinics, skills profiles, peer reviews, quiz attempts
8. `007_completion_workflows.sql` — Certificate verification
9. `008_workflow_automation.sql` — Notification triggers
10. `009_staff_assignments.sql` — Instructor cohort/squad assignments
11. `010_security_hardening.sql` — **CRITICAL:** RLS on cohorts/labs/assessments, secret column hiding, deactivated account blocking, anti self-promotion
12. `011_partner_courses.sql` — Partner marketplace (optional, for partner feature)

---

## 4. Security Model

### Migration 010 — Security Hardening (committed)

| Fix | Implementation |
|-----|---------------|
| RLS disabled on cohorts/labs/assessments | `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` + policies |
| `labs.solution_code` readable by students | Column-level grant: revoke table SELECT, re-grant without `solution_code` |
| `assessment_questions.correct_answer` readable | Column-level grant excludes `correct_answer` |
| Deactivated accounts access data | `current_profile_id()`/`current_profile_role()` require `is_active = 1` |
| Users self-promote to Administrator | `REVOKE UPDATE ON users`, re-grant only `(name, avatar, phone)` |
| Self-referential enrolments policy (infinite recursion) | `current_squad_ids()` SECURITY DEFINER helper |
| `users.password` leakage | Revoked from client roles; client reads explicit columns only |
| `labs.solution_code` / `assessment_questions.correct_answer` | Hidden from `authenticated`/`anon`; service role only |

### Role-Based Access

| Role | Can See | Can Edit | Portal URL |
|------|---------|----------|------------|
| Student | Own enrolments, squad, learning, partner catalog | Own profile, submissions, progress | `/student-login` |
| Instructor | All cohort data, submissions to grade | Grading, lessons, squads | `/instructor-login` |
| Partner | Own organization's courses | Own courses, lessons | `/partner-login` |
| Administrator | Everything | All academy operations | `/admin-login` |

### Fail-Closed Behavior

- Deactivated accounts (`is_active = 0`) get `NULL` from `current_profile_id()` — all RLS policies return no rows
- AuthContext `isBlocked()` clears the session on refresh if profile is missing or deactivated
- Login blocks deactivated and unprovisioned accounts with explicit messages

---

## 5. Edge Functions

Five deployable edge functions in `supabase/functions/`:

| Function | Purpose | Auth Required |
|----------|---------|---------------|
| `auth-handler` | Login, applications, admin signup, profile lookup | Yes (except login/apply) |
| `lessons` | Lesson CRUD, progress tracking (RLS-scoped) | Yes |
| `placements` | Placement management (admin-only writes) | Yes |
| `reports` | Cohort, domain, placement reports (admin-only) | Yes (Administrator) |
| `submissions` | Submission CRUD, grading (staff-only) | Yes |

**Auth pattern in edge functions:**
1. Extract Bearer token from `Authorization` header
2. Verify with `supabase.auth.getUser(token)` using service role
3. Look up profile by email in `public.users`
4. Check `is_active = 1`
5. For data queries, switch to the client (anon) key with the user's token so RLS applies

**Environment variables required in Supabase:**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`



## 6. Email Configuration

Two email systems are used in parallel:

### Supabase Auth Emails (confirmation, password reset, magic link, invite)

These are sent by Supabase Auth using SMTP. Configure in the Supabase dashboard under **Authentication → Email Templates** and **Authentication → SMTP Settings**:

**SMTP Settings (Resend recommended):**
- Host: `smtp.resend.com`
- Port: `465`
- Username: `resend`
- Password: Your Resend API key
- From: A verified sender address (e.g., `noreply@yourdomain.com`)

**Auth Site URL:** Set to your production frontend origin (e.g., `https://app.bluespacefintechacademy.com`)

**Redirect URLs:** Allow `/student-login`, `/instructor-login`, `/admin-login`, `/partner-login`, and `/reset-password`

**Email Templates:** Copy the HTML from `supabase/templates/` into the matching template in **Authentication → Email Templates**:
- `confirmation.html` → Confirmation email
- `recovery.html` → Password recovery
- `magic_link.html` → Magic link
- `invite.html` → Invitation
- `email_change.html` → Email change confirmation
- `email_changed_notification.html` → Email changed notification
- `password_changed_notification.html` → Password changed notification
- `reauthentication.html` → Reauthentication code

All templates include the BlueSPACE logo (`{{ .SiteURL }}/logo-dark.png`), brand color buttons, and fallback plain-text links. The logo requires your Auth Site URL to serve the frontend's public `logo-dark.png`.

### Application Status Emails (Resend Edge Function)

Application approval/rejection emails are sent via the `email-service` edge function using Resend directly.

**Required Supabase Edge Function secrets:**
- `RESEND_API_KEY`
- `EMAIL_FROM` (verified sender domain)
- `APP_ORIGIN` (production frontend origin)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`

**Authorization:** Callers must have an active academy profile. Non-administrators can only email themselves; administrators can email any recipient.

---

## 7. Frontend Structure

```
client/src/
├── App.jsx              # React router with role-gated routes
├── main.jsx             # Entry point
├── index.css            # Global styles + design tokens
├── context/
│   └── AuthContext.jsx  # Auth provider, profile loading, fail-closed guard
├── components/
│   ├── ui/              # shadcn/ui primitives
│   └── layout/
│       ├── AppLayout.jsx
│       ├── ProtectedRoute.jsx  # Role-based route guard
│       └── Sidebar.jsx         # Role-based navigation
├── lib/
│   └── supabase.js      # Supabase client initialization
└── pages/               # Route components
    ├── Login.jsx                 # 4 portals: student/instructor/partner/admin
    ├── Dashboard.jsx
    ├── MyLearning.jsx
    ├── LabWorkspace.jsx
    ├── LabsToReview.jsx          # Instructor grading queue
    ├── Certificates.jsx
    ├── SquadManagement.jsx
    ├── Grading.jsx
    ├── StudentMonitoring.jsx
    ├── PartnerCourses.jsx        # Partner course studio
    ├── PartnerCatalog.jsx        # Student partner course browse
    ├── PartnerCourseLearning.jsx # Partner course player
    ├── PartnerCourseReview.jsx   # Admin partner course approval
    ├── PartnerManagement.jsx     # Admin partner agency onboarding
    ├── Reports.jsx               # Admin reports
    └── ... (more pages)
```

### Authentication Flow

1. User visits `/student-login`, `/instructor-login`, `/partner-login`, or `/admin-login`
2. `Login.jsx` validates credentials via Supabase Auth
3. `AuthContext.loadProfile()` looks up `public.users` by email
4. Checks: `is_active === 1`, `type` matches portal role
5. On success: stores profile in context + localStorage, navigates to `/dashboard`
6. On page refresh: `AuthContext` restores session via `getSession()`, reloads profile, clears if blocked

### Route Protection

`ProtectedRoute` checks:
- `user` is not null (redirects to `/login`)
- `user.type` is in the `roles` array (redirects to `/unauthorized`)

---

## 8. Adding Test Accounts

Passwords are managed by **Supabase Auth**, not the `public.users` table. The `public.users.password` column is legacy and unused.

### Method 1: Supabase Dashboard (recommended for testing)

1. Go to your Supabase project dashboard → **Authentication → Users**
2. Click **Add user**
3. Enter email and password
4. The user is created in `auth.users`

### Method 2: Via the application

1. Open `/register` in your deployed app
2. Submit an application (name, email, password, role, track)
3. An Administrator reviews it at `/applications`
4. Admin provisions via `/auth-handler/signup`

### Method 3: Via auth-handler edge function (admin only)

```
POST /functions/v1/auth-handler/signup
Headers: Authorization: Bearer <admin-token>
Body: { "email": "new@user.com", "password": "...", "type": "Student", "name": "New User" }
```

### Critical Step — Activate the Profile

After creating a Supabase Auth user, you **must** ensure a matching `public.users` row exists with `is_active = 1`:

```sql
-- Find or create the profile
INSERT INTO public.users (name, email, type, is_active, avatar)
VALUES ('New User', 'new@user.com', 'Student', 1, 'avatar.png')
ON CONFLICT (email) DO UPDATE
SET is_active = 1, type = 'Student';
```

Without `is_active = 1`, login fails with "This account has been deactivated."

---

## 9. Common Issues & Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| "This account has been deactivated" | `is_active = 0` in `public.users` | Set `is_active = 1` via SQL or dashboard |
| "This account is not provisioned" | `type` is NULL or doesn't match portal | Set `type` to Student/Instructor/Administrator/Partner |
| "No academy profile" | No `public.users` row matching email | Insert profile row with matching email |
| `select('*') on users` fails | `track`, `password` not in column grant | Use explicit column list (no `track` — it's on `enrolments`) |
| 403 on logout | Browser hitting old auth endpoint | Normal; session already cleared client-side |
| Build fails on embedded selects | `users(track)` — `track` not on `users` | Join `enrolments` for track instead |

---

## 10. Deployment Checklist

- [ ] Create `.env` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- [ ] Apply migrations 001–011 to production Supabase project
- [ ] Deploy edge functions: `auth-handler`, `lessons`, `placements`, `reports`, `submissions`
- [ ] Configure Supabase Auth SMTP settings for password reset
- [ ] Set Auth Site URL and redirect URLs to production origin
- [ ] Create at least one Administrator account and activate it
- [ ] Push code to GitHub and connect Vercel
- [ ] Add environment variables in Vercel dashboard
- [ ] Rotate any exposed GitHub PATs (never commit tokens to `.git/config`)

---

## 11. Contributing

1. Create a branch from `main`
2. Make changes
3. Run `npm run build` and `npm run lint` in `client/`
4. Test migrations locally against Docker PostgreSQL
5. Commit with descriptive message
6. Open pull request

---

## 12. File Reference

| File | Purpose |
|------|---------|
| `supabase/schema.sql` | Foundation tables, indexes, FKs, triggers, base RLS (disabled) |
| `supabase/migrations/010_security_hardening.sql` | RLS enablement, secret column hiding, fail-closed auth |
| `supabase/migrations/011_partner_courses.sql` | Partner marketplace tables, functions, RLS policies |
| `supabase/functions/auth-handler/index.ts` | Login, applications, admin signup, profile |
| `supabase/functions/lessons/index.ts` | Lessons + progress (RLS-scoped) |
| `supabase/functions/submissions/index.ts` | Submissions + grading |
| `supabase/functions/placements/index.ts` | Placement management |
| `supabase/functions/reports/index.ts` | Admin reports |
| `client/src/context/AuthContext.jsx` | Auth provider, fail-closed guard |
| `client/src/pages/Login.jsx` | 4 role-based login portals |
| `client/src/App.jsx` | Route definitions with role guards |
| `client/src/components/layout/ProtectedRoute.jsx` | Role-based route protection |
| `client/src/components/layout/Sidebar.jsx` | Role-based navigation |

---

## 13. Security Notes

- **Never commit `.env` files or PAT tokens** to git
- **Never insert passwords into `public.users.password`** — column is revoked from client reads
- **Service role key must never be exposed in the browser** — only used in edge functions
- **All client reads use explicit column lists** — `select('*')` on `users`, `labs`, or `assessment_questions` will fail
- **Deactivated accounts are blocked at both DB and application layers** — RLS returns NULL, AuthContext clears session
