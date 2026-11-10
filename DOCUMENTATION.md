# BlueSPACE Fintech Academy LMS — Documentation

The single technical reference for developers, operators, and contributors.
It covers the architecture, database, security model, API, client integration,
design system, test logins, and deployment.

---

## Test Logins

Demo data is seeded by `database/01_schema.sql`; password hashes come from
`database/03_demo_passwords.sql`. Every demo account uses the same password:

```
BlueSpace2026!
```

Start the client at <http://localhost:3000> and open the portal for the role.

| Role | Email | Portal |
|------|-------|--------|
| Student | `student@bluespacefintechacademy.com` | `/student-login` |
| Student (Ada Okonkwo) | `ada.okonkwo@bluespacefintechacademy.com` | `/student-login` |
| Student (Kwame Asante) | `kwame.asante@bluespacefintechacademy.com` | `/student-login` |
| Student (Zainab Yusuf) | `zainab.yusuf@bluespacefintechacademy.com` | `/student-login` |
| Student (Emeka Ndiaye) | `emeka.ndiaye@bluespacefintechacademy.com` | `/student-login` |
| Student (Fatima Diallo) | `fatima.diallo@bluespacefintechacademy.com` | `/student-login` |
| Instructor (FinCore) | `fin.core@bluespacefintechacademy.com` | `/instructor-login` |
| Instructor (FaaS) | `faas.domain@bluespacefintechacademy.com` | `/instructor-login` |
| Instructor (FinOps) | `finops.domain@bluespacefintechacademy.com` | `/instructor-login` |
| Administrator | `academy.lead@bluespacefintechacademy.com` | `/admin-login` |
| Partner | `partner@bluespacefintechacademy.com` | `/partner-login` |

These are local demo credentials. Change or remove them before any shared
deployment.

---

## Local Setup

### Prerequisites

- Docker + Docker Compose
- Node.js 18+
- PHP 8.3 with `pdo_pgsql` (or `backend/bin/artisan` with the local extracted
  extension — see `backend/scripts/install-php-pgsql-local.sh`)
- Composer

### 1. Configure the environment

Copy the example files and generate the shared JWT secret locally:

```bash
cd lms
cp .env.example .env
cp backend/.env.example backend/.env
cp client/.env.example client/.env

# Put the output in PGRST_JWT_SECRET in both lms/.env and backend/.env.
openssl rand -hex 32
```

Set `DB_PASSWORD` in `backend/.env` to the `lms_service` password defined in
`database/00_bootstrap.sql`. The `authenticator` password in
`docker-compose.yml` and `database/00_bootstrap.sql` must match as well. These
are local development defaults; replace them before any shared deployment.

Never commit a populated `.env` file. The repository ignores `.env` variants.

### 2. Start PostgreSQL and PostgREST

```bash
docker compose up -d
```

The first start runs `database/*.sql` in filename order. Rebuild from scratch
with `docker compose down -v && docker compose up -d`.

### 3. Start the Laravel API

```bash
cd backend
composer install
./bin/artisan key:generate
./bin/artisan serve --host=127.0.0.1 --port=8001
```

Port `8001` is used because an unrelated local project already occupies `8000`.
The Vite proxy in `client/vite.config.js` targets `127.0.0.1:8001`.

### 4. Start the client

```bash
cd client
npm install
npm run dev
```

Open <http://localhost:3000>.

### Local services

| Service | Address | Notes |
|---------|---------|-------|
| PostgreSQL | `127.0.0.1:5433` | Local development container |
| PostgREST | `127.0.0.1:54330` | Internal only; the browser never calls it |
| Laravel API | `127.0.0.1:8001` | Bearer token from `/api/auth/login` |
| Vite client | `localhost:3000` | Development server |

### Environment variables

`lms/.env`:

| Variable | Purpose |
|----------|---------|
| `PGRST_JWT_SECRET` | Random 32+ byte secret shared with Laravel |
| `LMS_DB_PORT` | Host port for PostgreSQL (default `5433`) |
| `LMS_REST_PORT` | Host port for PostgREST (default `54330`) |

`backend/.env`:

| Variable | Purpose |
|----------|---------|
| `APP_URL` | Laravel origin, e.g. `http://localhost:8001` |
| `DB_*` | PostgreSQL connection; `DB_PASSWORD` must match the local role |
| `POSTGREST_URL` | Internal PostgREST origin |
| `PGRST_JWT_SECRET` | Must equal `lms/.env` |
| `LMS_FRONTEND_URL` | Frontend origin used in reset links |
| `LMS_TOKEN_TTL_MINUTES` | Bearer-token lifetime |
| `LMS_RECOVERY_TTL_MINUTES` | Password-reset token lifetime |
| `CORS_ALLOWED_ORIGINS` | Comma-separated allowed frontend origins |

`client/.env`:

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | API base path; `/api` in development |

Vite variables are compiled into the browser bundle. Never place a secret in a
`VITE_*` variable.

### Available scripts

From `lms/`:

- `npm run dev` — start the Vite client
- `npm run build` — build the client
- `npm run lint` — run ESLint
- `npm run format` — format with Prettier
- `npm run stack:up` — start PostgreSQL and PostgREST
- `npm run stack:down` — stop the stack
- `npm run stack:reset` — rebuild the database from `database/*.sql`
- `npm run api` — start Laravel on `127.0.0.1:8001`

---

## 1. System Overview

BlueSPACE Fintech Academy LMS is a learning management system training Finsoft and Finops Fellows on the AI Fintech Factory domains (FaaS, FinCore, FinOps, FinInfra). It provides role-based portals for Students, Instructors, Partners, and Administrators.

**Tech stack:**
- **Frontend:** React 18 + Vite + Tailwind CSS + shadcn/ui + Framer Motion
- **API/Auth:** Laravel 13 (`backend/`)
- **Data API:** PostgREST v16 (internal only)
- **Database:** PostgreSQL 17 with row-level security
- **Local stack:** Docker Compose (`db` + `rest`)
- **Icons:** Lucide React
- **Notifications:** React Hot Toast
- **Deployment:** Vercel (frontend) + Laravel host + managed PostgreSQL/PostgREST

---

## 2. Architecture

```
┌─────────────────┐    HTTPS /api    ┌──────────────────┐    HS256 JWT    ┌──────────────────┐
│   Vercel        │◄────────────────▶│   Laravel 8001   │◄───────────────▶│   PostgREST      │
│   (Frontend)    │                  │   auth + proxy   │                 │   54330          │
│                 │                  │                  │                 │                  │
│ React App       │                  │ AuthStore        │                 │ RLS enforced     │
│ Tailwind CSS    │                  │ Jwt              │                 │                  │
│ shadcn/ui       │                  │ DataProxy        │                 │                  │
└─────────────────┘                  └──────────────────┘                 └────────┬─────────┘
                                                                                   │ SQL
                                                                          ┌────────▼─────────┐
                                                                          │  PostgreSQL 17   │
                                                                          │  5433, RLS       │
                                                                          └──────────────────┘
```

### Auth model

- `public.users.password` stores a bcrypt hash. The former hosted auth schema
  dependency is gone.
- `POST /api/auth/login` verifies the password, inserts a random 32-byte opaque
  token (hashed with SHA-256) into `public.auth_tokens`, and returns the raw
  token to the client. Tokens expire after `LMS_TOKEN_TTL_MINUTES` (default
  seven days).
- Every protected request sends `Authorization: Bearer <token>`. The
  `auth.token` middleware resolves the token, rejects expired or inactive
  accounts, and attaches the academy profile as `auth_user`.
- Laravel signs a five-minute HS256 JWT for PostgREST with:
  `role=authenticated`, `sub=<users.auth_user_id>`, `email=<users.email>`.
- The React client never receives a PostgREST token, so it cannot alter the
  role claim.

### Authorization

PostgreSQL row-level security is the authority for every table read and write.
Laravel switches to `service_role` only for its own token lookup, application
creation, and password-reset table operations. Client data requests always run
as `authenticated` with the caller's `auth_user_id`, so RLS applies unchanged.

Column-level grants hide `users.password`, `labs.solution_code`, and
`assessment_questions.correct_answer` from `anon` and `authenticated`.

---

## 3. Database Schema & Files

The reproducible database lives in `lms/database/`. Files run once, in filename
order, when Docker creates the volume:

| File | Purpose |
|------|---------|
| `00_bootstrap.sql` | PostgREST roles, Laravel role, `auth` schema/functions, extensions |
| `01_schema.sql` | Tables, indexes, triggers, grants, RLS policies, demo data |
| `02_auth_tokens.sql` | `auth_tokens` and `password_resets` (service-role only) |
| `03_demo_passwords.sql` | Demo account bcrypt hashes (see Test Logins) |
| `04_partner_review_guard.sql` | Partner review guard triggers, notification and audit-log grants, instructor content scope |
| `05_announcement_admin_reach.sql` | Administrators can edit, pin and delete any announcement (instructors stay author-only) |
| `06_media_provider.sql` | `media_provider` on `lessons` and `partner_course_lessons` (`auto`/`youtube`/`self`/`none`) |
| `07_audit_spine.sql` | Trigger-written audit trail on 14 core tables, `administrators manage users` policy, credential-takeover guard |
| `08_column_grants.sql` | Re-asserts column-level grants lost to `ALTER DEFAULT PRIVILEGES`: hidden `users.password`, `labs.solution_code`, `assessment_questions.correct_answer` |

`00_bootstrap.sql` creates these API roles:

- `anon` — unauthenticated PostgREST requests (RLS denies data).
- `authenticated` — all signed-in users.
- `service_role` — `BYPASSRLS`, used only by Laravel internals.
- `authenticator` — PostgREST's login role; switches to the role above.
- `lms_service` — Laravel's direct PostgreSQL login.

The `auth` schema provides `auth.uid()`, `auth.email()`, `auth.role()`, and
`auth.jwt()`, which read `request.jwt.claims`. Existing policies use these
helpers, so the schema and policies carried over unchanged.

### Core tables

| Table | Description |
|-------|-------------|
| `users` | Academy profiles (name, email, type, is_active, partner_id) |
| `cohorts` | Quarterly intakes |
| `enrolments` | Links users to cohorts with track and status |
| `squads` | Mixed-track groups within cohorts |
| `modules` | Course modules within the 4-stage framework |
| `lessons` | Individual lessons within modules |
| `labs` | Guided lab assignments (`solution_code` hidden) |
| `assessments` | Quizzes and domain assessments (`correct_answer` hidden) |
| `submissions` | Student lab/assessment submissions |
| `lesson_progress` | Per-user lesson completion tracking |
| `use_cases` | Live Factory problems for the project stage |
| `sprints` | Two-week sprints within live projects |
| `certifications` | Fellow certification records |
| `placements` | Post-certification project placements |
| `notifications` | In-app notifications |
| `audit_logs` | Admin audit trail |
| `clinics` | Mentor office hours |
| `academy_applications` | Public applications awaiting review |
| `auth_tokens` | Opaque Laravel API tokens |
| `password_resets` | One-use recovery tokens |

### Partner tables

| Table | Description |
|-------|-------------|
| `partners` | Partner agencies (pending/approved/suspended) |
| `partner_courses` | Courses created by partners |
| `partner_course_lessons` | Lessons within partner courses |
| `partner_course_enrolments` | Student enrolments in partner courses |
| `partner_course_progress` | Per-user lesson progress in partner courses |

### Changing the schema

Add a new sequential file, for example `database/09_add_something.sql`. Never
edit a file that has already been applied to a shared environment.

```bash
docker compose exec -T db psql -U postgres -d postgres -v ON_ERROR_STOP=1 \
  < database/09_add_something.sql
```

`00_bootstrap.sql` grants `ALL` on new tables to `anon` and `authenticated`
through `ALTER DEFAULT PRIVILEGES`. A table-level grant overrides column-level
grants, so any new table holding a secret column must revoke the table grant and
re-grant the safe columns explicitly (see `08_column_grants.sql`).

For a repeatable local rebuild:

```bash
docker compose down -v
docker compose up -d
```

The Laravel migrations in `backend/database/migrations/` are legacy scaffolding
and do not describe this schema. Do not run `php artisan migrate` here.

---

## 4. Security Model

### Row-level security and grants

| Protection | Implementation |
|------------|----------------|
| Table access | RLS enabled on every public table; policies keyed to `current_profile_id()` / `current_profile_role()` |
| Deactivated accounts | Helpers return `NULL` when `is_active = 0`, so policies yield no rows |
| `users` writes | RLS limits self-service to the caller's own row; column grants allow only `name`, `avatar`, `phone` (plus administrator-managed fields); `guard_user_credentials` rejects non-administrator changes to role, email or status and blocks credential changes from any browser session |
| `users.password` | Excluded from the `SELECT`/`UPDATE` column grants on `authenticated`; authentication reads and writes it over `lms_service` |
| `labs.solution_code` | Column-level `SELECT` grant excludes it |
| `assessment_questions.correct_answer` | Column-level `SELECT` grant excludes it |
| Token tables | `REVOKE ALL` from client roles; only `service_role` may read/write |
| Partner review states | `enforce_partner_course_review` trigger: clients can only create drafts and move `draft`/`changes_requested` → `submitted`; reviewer columns and timestamps are frozen |
| Partner lesson publication | `enforce_partner_lesson_publish` trigger forces `is_published = false` for clients; `sync_partner_lesson_publication` publishes lessons when an administrator publishes the course |
| Notification writes | `create_notification` is executable by `service_role` only; `PUBLIC`, `anon`, and `authenticated` are revoked |
| Audit log writes | `INSERT`/`UPDATE`/`DELETE`/`TRUNCATE` on `audit_logs` revoked from client roles; administrators keep `SELECT` |
| Instructor content scope | Module and lesson writes are limited to cohorts in `instructor_cohort_assignments`; Administrators stay unrestricted |

### Role-based access

| Role | Can see | Can edit | Portal |
|------|---------|----------|--------|
| Student | Own enrolments, squad, learning, partner catalog | Own profile, submissions, progress | `/student-login` |
| Instructor | Cohort data, submissions to grade, own assigned cohort content | Grading, modules and lessons for assigned cohorts, direct publish | `/instructor-login` |
| Partner | Own organization's courses | Own drafts and lessons; may submit for review, never approve or publish | `/partner-login` |
| Administrator | Everything | All academy operations, partner review and publication | `/admin-login` |

### Squad, enrolment, and user management

- `squads` RLS permits Instructor and Administrator writes; `SquadManagement`
  intentionally limits the UI to Administrators and shows a read-only notice
  for Instructors.
- `enrolments` management is Administrator-only.
- Administrators manage roles, activation and account deletion from
  `UserManagement`. The `administrators manage users` policy provides the write
  access; the credential guard still prevents password or auth-identity
  takeover, so those remain server-side operations.
- Zero-row updates surface an explicit permission error instead of failing
  silently.

### Audit trail

- `record_audit_row()` is an `AFTER INSERT OR UPDATE OR DELETE` trigger on 14
  core tables: `users`, `cohorts`, `enrolments`, `modules`, `lessons`, `labs`,
  `assessments`, `announcements`, `partners`, `partner_courses`,
  `partner_course_lessons`, `instructor_cohort_assignments`, `certifications`
  and `placements`.
- Triggers write the log, so entries cannot be forged or erased from the
  browser: `audit_logs` keeps `SELECT` (Administrators only) and no client write
  grant.
- Each entry snapshots the actor's id, name and role, the entity and its id, and
  the **names** of the columns that changed. Values are never copied, so
  passwords, quiz answers and lab solutions stay out of the log.
- Creates and ordinary updates are `INFO`; deletes and changes to roles,
  activation, partner ownership or enrolment status are `WARNING`.
- No-op updates (including login `last_login_at` touches) are skipped.
- `/audit-log` is the Administrator viewer: last 300 entries, filters by
  severity, entity and free text, plus CSV export. It is read-only.

### Fail-closed behavior

- Deactivated accounts get `NULL` from the profile helpers; all RLS policies
  return no rows.
- `AuthContext` clears the session on refresh if the profile is missing,
  inactive, or the wrong role.
- Login blocks deactivated and unprovisioned accounts with explicit messages.
- The client logs out after 30 minutes of inactivity.

---

## 5. Laravel API

The complete surface is in `backend/routes/api.php`.

### Controllers

| Controller | Responsibility |
|------------|----------------|
| `AuthController` | Login, session, profile, update-user, change-password, apply, admin signup, forgot/reset password |
| `DataProxyController` | Forwards table requests to PostgREST with a signed JWT |
| `RpcController` | Forwards database function calls with the same JWT |
| `FunctionsController` | `auth-handler` compatibility shim and transactional email |

### Support classes

| Class | Responsibility |
|-------|----------------|
| `App\Support\AuthStore` | Service-role database access, opaque token creation, session lookup, user lookup |
| `App\Support\Jwt` | HS256 signing for PostgREST |
| `App\Http\Middleware\AuthenticateToken` | Reads the bearer token, validates expiry and active status, sets `auth_user` |

### Data proxy details

`DataProxyController` forwards the method, query string, `Content-Type`,
`Prefer`, and `Range` headers. It only resumes the `Content-Type`,
`Content-Range`, `Preference-Applied`, and `Location` response headers. The path
is restricted to `[A-Za-z0-9_-]` segments, so it cannot be used to reach another
host or service.

### Rate limits

`login` and `apply` are limited to 20 requests per minute per IP; the three
password-reset endpoints are limited to 10 per minute.

### Local PHP requirement

`backend/bin/artisan` loads the locally extracted `pdo_pgsql` extension from
`backend/.php-ext`. On a normal host with `php8.3-pgsql` installed, plain
`php artisan` works and the wrapper simply delegates to it. To extract the
extension without sudo:

```bash
cd backend
./scripts/install-php-pgsql-local.sh
./bin/artisan serve --host=127.0.0.1 --port=8001
```

---

## 6. Client Integration

`client/src/lib/backend.js` is the only transport layer. It exposes a small
query-builder API so page code stays unchanged:

```js
import { api } from '../lib/backend'

const { data, error } = await api
  .from('submissions')
  .select('id, score, users!submissions_user_id_fkey(name)')
  .eq('user_id', profile.id)
  .order('submitted_at', { ascending: false })
```

Supported builder methods: `select`, `insert`, `update`, `upsert`, `delete`,
`eq`, `in`, `is`, `not`, `gte`, `lte`, `ilike`, `order`, `limit`, `single`,
`maybeSingle`.

Supported auth calls: `signInWithPassword`, `signOut`, `getSession`, `getUser`,
`updateUser`, `resetPasswordForEmail`, `resend`, `onAuthStateChange`.

Supported function calls: `functions.invoke('auth-handler' | 'email-service')`
and `rpc(name, params)`.

### Password recovery

The reset link is `/reset-password?from=…#access_token=…&type=recovery`.
`lib/backend.js` stores the token in `sessionStorage`, removes it from the
address bar, emits `PASSWORD_RECOVERY`, and exchanges it through
`POST /api/auth/reset-password` when the form calls
`api.auth.updateUser({ password })`. The recovery token cannot be used for data
access.

### Authentication flow

1. User visits `/student-login`, `/instructor-login`, `/partner-login`, or
   `/admin-login`.
2. `Login.jsx` calls `api.auth.signInWithPassword`.
3. `AuthContext.loadProfile()` reads `public.users` by email with an explicit
   column list.
4. Checks: `is_active === 1` and `type` matches the portal role.
5. On success: profile is stored in context/localStorage and the user lands on
   `/dashboard`.
6. On refresh: `getSession()` restores the token, the profile is reloaded, and
   blocked accounts are cleared.

### Route protection

`ProtectedRoute` checks that a user exists and that `user.type` is in the
route's `roles` array; otherwise it redirects to `/unauthorized`.

### Authoring and review flows

- `Curriculum.jsx` is the Administrator overview; it links into the shared
  editor rather than duplicating a module form.
- `MyModules.jsx` lists the modules an Instructor can edit.
- `ModuleEditor.jsx` handles both `/modules/create` and `/modules/:moduleId`:
  module fields, lesson create/edit/delete, reordering, per-lesson preview and
  publishing. Each lesson can also carry one lab (title, instructions, starter
  code, due date and max score), attached inline from the lesson row. Publishing
  requires at least one lesson. Instructors publish directly; the database
  scopes their writes to their assigned cohorts.
- `LessonPlayer.jsx` is used by Students and, with `readOnly`, by staff
  previewing a lesson. In preview mode no `lesson_progress` row is written and
  the lab call to action points at `/grading`.
- Media is provider-neutral. `lessons.media_provider` and
  `partner_course_lessons.media_provider` accept `auto` (infer from the URL),
  `youtube`, `self` or `none`. Lectures normally use unlisted YouTube links;
  audio, captions, thumbnails and short assets are the only files hosted by the
  academy. `components/YouTubeFrame.jsx` uses the YouTube IFrame Player API so
  watch time is still recorded for YouTube lectures, and `MediaPlayer.jsx`
  falls back to a native `<video>`/`<audio>` element for self-hosted files.
- `PartnerCourses.jsx` is the partner studio: drafts, lessons, and submission
  for review. Lessons are created unpublished.
- `PartnerCourseReview.jsx` is the Administrator review queue: approve and
  publish, or return with written notes. Publishing the course publishes its
  lessons through the database trigger.
- `Announcements.jsx` is readable by every signed-in role. Instructors and
  Administrators get the composer, pin toggle and delete; an Instructor only
  manages their own posts, while an Administrator can correct anyone's. Students
  get read tracking through `announcement_reads`.
- The global search palette (`components/layout/GlobalSearch.jsx`) is opened
  with Ctrl/Cmd+K or `/` and searches only the tables the current role can read,
  including announcements.

---

## 7. Design System

The full design source of truth is [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md).
The rules below are the ones most likely to be broken by new work.

### Direction

Institutional, editorial and operational. BlueSPACE blue (`#0000FF`) is the
only brand accent; hierarchy comes from typography, spacing and borders rather
than decorative colour.

### Layout

- Authenticated pages are **full width** inside the shell. Do not wrap a page
  in `max-w-7xl` or another page-level max width.
- The shell is a fixed 256px sidebar (`lg:pl-64`) plus a 56px sticky top bar
  (`h-14`).
- The top bar carries only global search, the current cohort name (hidden below
  `sm`) and notifications. Do not add date/time or student IDs there.
- Main content uses `w-full min-w-0 px-4 sm:px-6 lg:px-8 py-6`.
- Narrow widths are legitimate only for narrow content: auth cards (`max-w-sm`),
  confirmation states (`max-w-md`), short forms (`max-w-2xl`/`max-w-3xl`) and
  the certificate (`max-w-5xl`, `print:max-w-none`).

### Surfaces and status

- Cards: `rounded-xl border border-gray-200/90 bg-white shadow-sm`.
- Badges and chips are **flat and border-only**: `border` plus text colour, no
  filled pastel pills and no gradients. Variants live in
  `client/src/components/ui/badge.jsx`.
- Dates, times, student IDs and reference codes are plain text, never badges.
- Use the shared `Badge`, `Button`, `Card` and `Input` primitives rather than
  re-implementing styles per page.

### Typography and tokens

- Manrope (200–800) across the product; the certificate is the only exception
  and uses its own serif pairing.
- Tokens live in `client/tailwind.config.js` and `client/src/index.css`. Do not
  introduce new hex values outside those files.
- Domain colours (`domain.faas`, `domain.fincore`, `domain.finops`,
  `domain.fininfra`) identify domains only, never success/error states.

### Certificate

The certificate is a separate editorial surface
(`client/src/components/certificate/ProfessionalCertificate.jsx`): A3
landscape, formal serif hierarchy, executive palette, and self-contained
verification metadata. It must stay legible in black and white, and the public
`/verify/:token` view must be checked alongside the in-app dialog.

---

## 8. Frontend Structure

```
client/
├── public/              # logo-dark.png, logo-light.png, logo-white.png, favicon.*
└── src/
    ├── App.jsx              # React router with role-gated routes
    ├── main.jsx             # Entry point
    ├── index.css            # Global styles + design tokens
    ├── context/
    │   └── AuthContext.jsx  # Auth provider, profile loading, inactivity logout
    ├── components/
    │   ├── ui/              # shadcn/ui primitives (flat badge, button, card…)
    │   ├── layout/
    │   │   ├── AppLayout.jsx
    │   │   ├── ProtectedRoute.jsx
    │   │   └── Sidebar.jsx
    │   └── certificate/     # ProfessionalCertificate + verification view
    ├── lib/
    │   ├── backend.js       # Laravel API client + query builder
    │   ├── profile.js       # Profile column list and lookup
    │   ├── deadlines.js     # Deadline formatting helpers
    │   └── emailService.js  # Transactional email composer
    └── pages/               # Route components
```

### Repository layout (outside `client/`)

```
lms/
├── backend/        # Laravel API, auth, PostgREST proxy, certificate script
├── database/       # Reproducible PostgreSQL bootstrap (sequential files)
├── docs/           # Design system source of truth
├── assets/brand/   # Brand source assets
├── README.md       # Product overview and quick start
├── DOCUMENTATION.md
└── docker-compose.yml
```

### Unused page files

These exist but are not imported by `App.jsx`:

- `LabsToReview.jsx`
- `ProjectWorkspace.jsx`
- `SkillsProfile.jsx`
- `SubmissionFeedback.jsx`

`/project-workspace` redirects to `/my-squad`, and `/my-squad` is Student-only.
`/quiz/:assessmentId` is a live student route but no page links to it.

---

## 9. Provisioning Accounts

The demo data lives in `database/01_schema.sql` and the password hashes in
`database/03_demo_passwords.sql`. The shared password and the complete login
list are in [Test Logins](#test-logins).

### Adding an account

1. Submit `/register`, or call `POST /api/auth/apply`.
2. An Administrator reviews the application at `/applications`.
3. Approval creates or activates the matching `public.users` row and enrols
   students in the selected cohort/track.

For a manual account, insert a profile with a bcrypt password and an
`auth_user_id`:

```sql
INSERT INTO public.users (auth_user_id, name, email, password, type, is_active, avatar)
VALUES (
  gen_random_uuid(),
  'New User',
  'new@user.com',
  crypt('<set-a-strong-password>', gen_salt('bf')),
  'Student',
  1,
  '/avatars/student.png'
);
```

Without `is_active = 1`, login fails with "This account has been deactivated."

---

## 10. Common Issues & Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| Login 500 with `could not find driver` | PHP missing `pdo_pgsql` | Use `./bin/artisan`, or install `php8.3-pgsql` |
| Login 500 with `password authentication failed` | `.env` password does not match `00_bootstrap.sql` | Set `DB_PASSWORD` in `backend/.env` to the `lms_service` password defined in `database/00_bootstrap.sql`, and keep `docker-compose.yml` in sync |
| PostgREST returns 401 for every request | `PGRST_JWT_SECRET` differs between compose and Laravel | Set the same value in `lms/.env` and `backend/.env`, then restart both |
| Data request returns `[]` unexpectedly | RLS policy or wrong role | Check the signed-in profile's `type` and `is_active` |
| `select('*')` on `users` fails | `password` is not in the column grant | Use `PROFILE_COLUMNS` from `lib/profile.js` |
| "This account has been deactivated" | `is_active = 0` | Set `is_active = 1` |
| "This account is not provisioned" | `type` is NULL or wrong portal | Set `type` to Student/Instructor/Administrator/Partner |
| Build fails on embedded selects | Column missing from the joined table | Join `enrolments` for `track`; it is not on `users` |
| Password reset email missing | `MAIL_MAILER=log` | Read `backend/storage/logs/laravel.log`, or configure SMTP |
| Portable PHP wrapper fails | `.php-ext` missing | Run `backend/scripts/install-php-pgsql-local.sh` |

---

## 11. Deployment Checklist

- [ ] Provision PostgreSQL 17 and apply `database/*.sql` in order
- [ ] Run PostgREST privately with the same `PGRST_JWT_SECRET` as Laravel
- [ ] Deploy `backend/` with PHP 8.3, `pdo_pgsql`, and `composer install --no-dev`
- [ ] Set `APP_URL`, database credentials, `POSTGREST_URL`, and mail settings
- [ ] Change every development password and rotate the JWT secret
- [ ] Set `LMS_FRONTEND_URL` and `CORS_ALLOWED_ORIGINS` to the production origin
- [ ] Build the client with `VITE_API_URL=https://<api-host>/api`
- [ ] Deploy the client to Vercel
- [ ] Create at least one active Administrator account
- [ ] Never commit `.env` files, JWTs, or database passwords

---

## 12. Contributing

1. Create a branch from `main`.
2. Make changes.
3. Run `npm run build` and `npm run lint` in `client/`.
4. For PHP changes, run `vendor/bin/pint --dirty --format agent` in `backend/`.
5. Test database changes against a fresh `docker compose down -v && docker compose up -d`.
6. Commit with a descriptive message and open a pull request.

---

## 13. File Reference

| File | Purpose |
|------|---------|
| `database/00_bootstrap.sql` | Roles, auth schema/functions, extensions |
| `database/01_schema.sql` | Full academy schema, data, grants, RLS |
| `database/02_auth_tokens.sql` | Laravel token and reset tables |
| `database/03_demo_passwords.sql` | Demo bcrypt hashes |
| `docker-compose.yml` | PostgreSQL and PostgREST services |
| `backend/routes/api.php` | Complete API surface |
| `backend/app/Http/Controllers/AuthController.php` | Auth, applications, password reset |
| `backend/app/Http/Controllers/DataProxyController.php` | RLS-preserving PostgREST proxy |
| `backend/app/Support/AuthStore.php` | Service-role data access and sessions |
| `backend/app/Support/Jwt.php` | PostgREST JWT signing |
| `client/src/lib/backend.js` | Client transport and query builder |
| `client/src/context/AuthContext.jsx` | Auth provider, fail-closed guard |
| `client/src/pages/Login.jsx` | Four role-based login portals |
| `client/src/App.jsx` | Route definitions with role guards |
| `client/src/components/layout/ProtectedRoute.jsx` | Role-based route protection |
| `client/src/components/layout/Sidebar.jsx` | Role-based navigation |
| `client/src/components/ui/badge.jsx` | Flat, background-free badge variants |
| `client/src/components/ui/book.jsx` | Bookshelf-style module cover with open animation |
| `client/src/components/ui/use-responsive.js` | Responsive width hook used by `Book` |
| `client/src/components/certificate/ProfessionalCertificate.jsx` | Print certificate and verification view |
| `docs/DESIGN_SYSTEM.md` | Visual language and component rules |
| `README.md` | Product overview and quick start |
| `assets/brand/` | Brand source assets (logos) |
| `backend/scripts/certificate_generator.py` | Certificate PDF generator |

### Known gaps

- Squad mutations are Administrator-only in the UI even though the `squads`
  policy allows Instructors.
- Dead page files: `LabsToReview.jsx`, `ProjectWorkspace.jsx`,
  `SkillsProfile.jsx`, `SubmissionFeedback.jsx`.
- `/quiz/:assessmentId` has no UI link.
- The `payments` table is unused.
- Google Meet/Calendar automation is not enabled.

---

## 14. Security Notes

- **Never commit `.env` files, tokens, or passwords.**
- **Never insert a password into a client-readable column.** `users.password` is
  not granted to `anon` or `authenticated`.
- **Never expose `service_role` or the PostgREST JWT secret to the browser.**
- **Use explicit column lists** on `users`, `labs`, and `assessment_questions`;
  `select('*')` is denied by the grants.
- **A table-level grant defeats column-level grants.** Any new table with a
  secret column must `REVOKE ALL` from `anon`/`authenticated` and re-grant the
  safe columns, as `08_column_grants.sql` does.
- **Audit rows are trigger-written.** Clients have `SELECT` only (Administrators)
  and cannot forge or erase history.
- **Deactivated accounts are blocked at both layers** — RLS returns no rows and
  `AuthContext` clears the session.
- **Rotate the JWT secret** if it is ever shared outside Laravel/PostgREST.
