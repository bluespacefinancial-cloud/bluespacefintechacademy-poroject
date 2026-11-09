# BlueSPACE Fintech Academy LMS

Learning Management System for the BlueSPACE Fintech Academy, training Finsoft and Finops Fellows on the AI Fintech Factory domains (FaaS, FinCore, FinOps, FinInfra).

## Tech Stack

- **Frontend:** React 18 + Vite + Tailwind CSS + shadcn/ui + Framer Motion
- **API / Auth:** Laravel 13 (`backend/`) with opaque bearer tokens
- **Data API:** PostgREST, reachable only from Laravel
- **Database:** PostgreSQL 17 with row-level security and column-level grants
- **Local stack:** Docker Compose (`lms-postgres` + `lms-postgrest`)
- **Icons:** Lucide React
- **Notifications:** React Hot Toast

## Project Structure

```
lms/
├── client/                     # React frontend
│   ├── public/                 # Brand assets: logo-dark/light/white, favicon
│   └── src/
│       ├── components/ui/      # shadcn/ui components
│       ├── components/layout/  # AppLayout, Sidebar, ProtectedRoute
│       ├── components/certificate/  # Print certificate and verification view
│       ├── context/            # AuthContext
│       ├── lib/backend.js      # Laravel API client + query builder
│       ├── pages/              # Route components
│       ├── App.jsx             # App router
│       └── main.jsx            # Entry point
├── backend/                    # Laravel API (auth, data proxy, RPC, email)
│   ├── app/Http/Controllers/   # Auth, DataProxy, Rpc, Functions
│   ├── app/Support/            # AuthStore (tokens), Jwt (PostgREST signing)
│   ├── bin/artisan             # Artisan wrapper with local pdo_pgsql
│   ├── scripts/                # Certificate generator, local PHP helpers
│   └── routes/api.php          # The complete API surface
├── database/                   # Reproducible PostgreSQL bootstrap (run in order)
│   ├── 00_bootstrap.sql        # Roles, auth schema/functions, extensions
│   ├── 01_schema.sql           # Tables, data, grants, RLS policies
│   ├── 02_auth_tokens.sql      # API tokens + password reset tokens
│   └── 03_demo_passwords.sql   # Demo account password hashes
├── docs/                       # Design system source of truth
│   └── DESIGN_SYSTEM.md        # Visual language and component rules
├── assets/brand/               # Brand source assets (BFALogo.png, BFALogo2.png)
├── docker-compose.yml          # PostgreSQL + PostgREST
├── .env.example                # Compose settings (PGRST_JWT_SECRET)
├── vercel.json                 # Vercel frontend config
├── DOCUMENTATION.md            # Technical reference and test logins
└── README.md
```

The technical reference, including test logins, is
[`DOCUMENTATION.md`](DOCUMENTATION.md). The design source of truth is
[`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md).

## Architecture

```
┌──────────────┐   /api/*    ┌──────────────┐   signed JWT   ┌──────────────┐
│ React client │────────────▶│ Laravel 8001 │───────────────▶│ PostgREST    │
│ (Vite 3000)  │◀────────────│ auth + proxy │◀───────────────│ 54330        │
└──────────────┘             └──────────────┘                └──────┬───────┘
                                                                     │ SQL
                                                              ┌──────▼───────┐
                                                              │ PostgreSQL   │
                                                              │ 5433, RLS    │
                                                              └──────────────┘
```

**Auth model:** Laravel checks the email/password against `public.users.password`
(bcrypt), creates an opaque token in `public.auth_tokens`, and returns it to the
client. The client sends that token as `Authorization: Bearer …`. Laravel looks
the token up, confirms the account is active, and signs a short-lived HS256 JWT
for PostgREST carrying the caller's `auth_user_id` and email.

**Authorization:** PostgreSQL row-level security remains the authority on every
read and write. Laravel never sends a service-role request for client data; it
only switches to `service_role` for its own token, application, and reset-table
operations. Column-level grants hide `users.password`, `labs.solution_code`, and
`assessment_questions.correct_answer` from client roles.

**Why a proxy:** the browser never receives a PostgREST token, so it cannot
forge a role claim. Laravel fixes the role to `authenticated` and forwards the
request with a five-minute JWT.

## Design System

The interface is institutional, editorial and operational: full-width working
pages, flat border-only badges and chips, and a quiet top bar that carries only
search, the current cohort and notifications. BlueSPACE blue (`#0000FF`) is the
single brand accent; hierarchy comes from typography, spacing and borders.

- **Design source of truth:** [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md)
- **Tokens:** `client/tailwind.config.js` and `client/src/index.css`
- **Shell:** `client/src/components/layout/AppLayout.jsx`
- **Shared primitives:** `client/src/components/ui/`

Keep new work inside those rules: do not wrap pages in a page-level `max-w-*`,
do not add filled status pills, and do not put dates, times or student IDs in
the top bar.

## Getting Started

### Prerequisites

- Docker + Docker Compose
- Node.js 18+
- PHP 8.3 with `pdo_pgsql` (or use `backend/bin/artisan` with the local
  extracted extension — see `backend/scripts/install-php-pgsql-local.sh`)
- Composer

### 1. Start PostgreSQL and PostgREST

```bash
cd lms
cp .env.example .env
# Set PGRST_JWT_SECRET to a random 32+ byte hex value:
#   openssl rand -hex 32
docker compose up -d
```

The first start runs `database/*.sql` in filename order. To rebuild the database
from scratch:

```bash
docker compose down -v
docker compose up -d
```

Check the stack:

```bash
docker compose ps
docker compose exec db psql -U postgres -d postgres -c '\dt public.*'
```

### 2. Start the Laravel API

```bash
cd backend
cp .env.example .env
composer install
./bin/artisan key:generate

# The JWT secret must be identical to lms/.env:
#   PGRST_JWT_SECRET=<same value as lms/.env>
./bin/artisan serve --host=127.0.0.1 --port=8001
```

Port `8001` is used because an unrelated local project already occupies `8000`.
The Vite proxy in `client/vite.config.js` targets `127.0.0.1:8001`.

### 3. Start the client

```bash
cd client
cp .env.example .env      # VITE_API_URL=/api
npm install
npm run dev
```

Open <http://localhost:3000>.

### Local ports and credentials

| Service | Address | Credentials |
|---------|---------|-------------|
| PostgreSQL | `127.0.0.1:5433` | `lms_service` / `bluespace_laravel_2026` |
| PostgREST | `127.0.0.1:54330` | internal only; `authenticator` / `bluespace_postgrest_2026` |
| Laravel API | `127.0.0.1:8001` | bearer token from `/api/auth/login` |
| Vite client | `http://localhost:3000` | — |

These are local development credentials. Replace every password and the JWT
secret before deploying anywhere shared.

## Demo Accounts

The demo data is part of `database/01_schema.sql`; the shared password hash is
applied by `database/03_demo_passwords.sql`. All accounts use:

```
BlueSpace2026!
```

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

## Database Changes

`lms/database/` is the source of truth for a fresh environment:

- `00_bootstrap.sql` creates the PostgREST roles (`anon`, `authenticated`,
  `service_role`, `authenticator`), the Laravel role (`lms_service`), the `auth`
  schema/functions, and the required extensions.
- `01_schema.sql` contains every table, index, trigger, grant and RLS policy plus
  the demo data.
- `02_auth_tokens.sql` adds the token tables used by Laravel.
- `03_demo_passwords.sql` sets the demo bcrypt hashes.

For a schema change, add a new sequential file such as
`database/04_your_change.sql`. Do not edit a file that has already been applied
to an existing environment. Apply it with:

```bash
docker compose exec -T db psql -U postgres -d postgres -v ON_ERROR_STOP=1 \
  < database/04_your_change.sql
```

The Laravel files under `backend/database/migrations/` are legacy scaffolding and
are not the academy schema. Do not run `php artisan migrate` against this
database.

## API Surface

All endpoints are under `/api`:

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/auth/login` | Email/password login, returns opaque token |
| `POST` | `/auth/apply` | Public application/registration |
| `POST` | `/auth/forgot-password` | Create a password-reset link |
| `POST` | `/auth/reset-password` | Exchange a reset token for a new password |
| `GET` | `/auth/session` | Validate the bearer token |
| `GET` | `/auth/user` | Current auth user |
| `GET` | `/auth/profile` | Current user + academy profile |
| `POST` | `/auth/update-user` | Password/email/profile update |
| `POST` | `/auth/change-password` | Change own password |
| `POST` | `/auth/logout` | Revoke the token |
| `GET/POST/PATCH/DELETE` | `/data/{table}` | RLS-scoped table access via PostgREST |
| `POST` | `/rpc/{function}` | RLS-scoped database function |
| `POST` | `/functions/auth-handler` | Compatibility shim (apply/signup/profile) |
| `POST` | `/functions/email` | Transactional email (admin or self) |
| `GET` | `/health` | Liveness check |

The React client uses `client/src/lib/backend.js`, which mirrors the small
query surface the pages already use (`from`, `select`, `eq`,
`in`, `not`, `is`, `gte`, `lte`, `order`, `limit`, `single`, `maybeSingle`,
`insert`, `update`, `upsert`, `delete`, `rpc`, `auth.*`, `functions.invoke`).

## Environment Variables

### `lms/.env` (Docker Compose)

```
PGRST_JWT_SECRET=<openssl rand -hex 32>
LMS_DB_PORT=5433
LMS_REST_PORT=54330
```

### `backend/.env`

```
APP_URL=http://localhost:8001
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5433
DB_DATABASE=postgres
DB_USERNAME=lms_service
DB_PASSWORD=bluespace_laravel_2026

POSTGREST_URL=http://127.0.0.1:54330
PGRST_JWT_SECRET=<same value as lms/.env>
LMS_FRONTEND_URL=http://localhost:3000
LMS_TOKEN_TTL_MINUTES=10080
LMS_RECOVERY_TTL_MINUTES=60
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### `client/.env`

```
VITE_API_URL=/api
```

## Email

Laravel sends password-reset and transactional email through its configured
mailer. Set `MAIL_*` in `backend/.env`; production should use SMTP with a
verified sender. `MAIL_MAILER=log` writes messages to
`backend/storage/logs/laravel.log` for local development.

The public registration flow does not require email confirmation; applications
are reviewed by an Administrator at `/applications`.

## Deployment

1. Deploy the frontend through Vercel (`vercel.json` already sets the build).
   Set `VITE_API_URL` to the public Laravel origin plus `/api`.
2. Host `backend/` on PHP 8.3 with the `pdo_pgsql` extension. Run
   `composer install --no-dev`, set the production `.env`, and point the web
   server at `backend/public`.
3. Run PostgreSQL 17 and PostgREST privately. Apply `database/*.sql` in order or
   use your normal migration process, then set the same `PGRST_JWT_SECRET` in
   Laravel and PostgREST.
4. Set `LMS_FRONTEND_URL` and `CORS_ALLOWED_ORIGINS` to the production frontend
   origin.
5. Change every development password and rotate the JWT secret.

## Known Limitations

- **Administrator user mutations are intentionally blocked.** `UserManagement`
  cannot change roles, deactivate/reactivate or delete users because security
  hardening revokes those mutations. Manage those operations with SQL.
- **Squad mutations are Administrator-only in the UI.** The `squads` policy still
  permits Instructors, but `SquadManagement` treats Instructors as read-only.
- **Student lab resubmission is guarded.** Students may update their own ungraded
  submissions; a trigger rejects changes to grading fields, ownership, or
  already-graded rows.
- **No UI link to `/quiz/:assessmentId`.** The student route exists.
- **Dead page files remain in the tree:** `LabsToReview.jsx`,
  `ProjectWorkspace.jsx`, `SkillsProfile.jsx`, `SubmissionFeedback.jsx`. They are
  not imported by `App.jsx`.
- **`/project-workspace` redirects to `/my-squad`**, and `/my-squad` is
  Student-only.
- **The `payments` table is unused.** Live classes and the academy are free.
- **Google Meet/Calendar automation is not enabled.** The `google_integrations`
  table stores server-side OAuth fields; create credentials in the Laravel
  environment, never in Vite variables.

## Available Scripts

From `lms/`:

- `npm run dev` — start the Vite client
- `npm run build` — build the client
- `npm run lint` — run ESLint
- `npm run format` — format with Prettier
- `npm run stack:up` — start PostgreSQL and PostgREST
- `npm run stack:down` — stop the stack
- `npm run stack:reset` — rebuild the database from `database/*.sql`
- `npm run api` — start Laravel on `127.0.0.1:8001`

## License

Private - BlueSPACE Internal
