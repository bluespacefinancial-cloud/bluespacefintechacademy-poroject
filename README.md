# BlueSPACE Fintech Academy LMS

Learning management system for the BlueSPACE Fintech Academy, delivering
cohort-based training across the AI Fintech Factory domains: **FaaS**,
**FinCore**, **FinOps** and **FinInfra**.

> **Security notice:** this repository includes local development configuration
> and seeded demo data. Never commit real credentials, and rotate every secret
> before deploying to a shared or production environment.

## Overview

The platform provides separate portals for Students, Instructors,
Administrators and Partners. Students work through cohort modules and lessons,
track progress, submit labs and assessments, and earn certificates. Instructors
review submissions and run live sessions; Administrators manage cohorts and
accounts; Partners access the partner course catalogue.

Authorization is enforced in PostgreSQL through row-level security (RLS) and
column-level grants. Laravel authenticates the caller and proxies data requests
to PostgREST with a short-lived signed token, so the browser never receives a
database role claim.

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, shadcn/ui, Framer Motion
- **API / Auth:** Laravel 13 (`backend/`) with opaque bearer tokens
- **Data API:** PostgREST, reachable only from Laravel
- **Database:** PostgreSQL 17 with row-level security and column-level grants
- **Local stack:** Docker Compose (`lms-postgres` + `lms-postgrest`)
- **Icons:** Lucide React
- **Notifications:** React Hot Toast

## Architecture

```text
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

**Auth model:** Laravel verifies the email/password against
`public.users.password` (bcrypt), creates an opaque token in
`public.auth_tokens`, and returns it to the client. The client sends that token
as `Authorization: Bearer …`. Laravel looks the token up, confirms the account
is active, and signs a short-lived HS256 JWT for PostgREST carrying the caller's
`auth_user_id` and email.

**Authorization:** PostgreSQL RLS remains the authority on every read and
write. Laravel never sends a service-role request for client data; it only uses
`service_role` for its own token, application and reset-table operations.
Column-level grants hide `users.password`, `labs.solution_code` and
`assessment_questions.correct_answer` from client roles.

**Why a proxy:** the browser never receives a PostgREST token, so it cannot
forge a role claim. Laravel fixes the role to `authenticated` and forwards the
request with a five-minute JWT.

See [`DOCUMENTATION.md`](DOCUMENTATION.md) for the full architecture, security
model and API details.

## Project Structure

```text
lms/
├── client/                          # React frontend
│   ├── public/                      # Brand assets: logo-dark/light/white, favicon
│   └── src/
│       ├── components/ui/           # shadcn/ui primitives, including the book cover
│       ├── components/layout/       # AppLayout, Sidebar, ProtectedRoute
│       ├── components/certificate/  # Print certificate and verification view
│       ├── context/                 # AuthContext
│       ├── lib/backend.js           # Laravel API client + query builder
│       ├── pages/                   # Route components
│       ├── App.jsx                  # App router
│       └── main.jsx                 # Entry point
├── backend/                         # Laravel API (auth, data proxy, RPC, email)
│   ├── app/Http/Controllers/        # Auth, DataProxy, Rpc, Functions
│   ├── app/Support/                 # AuthStore (tokens), Jwt (PostgREST signing)
│   ├── bin/artisan                  # Artisan wrapper with local pdo_pgsql
│   ├── scripts/                     # Certificate generator, local PHP helpers
│   └── routes/api.php               # The complete API surface
├── database/                        # Reproducible PostgreSQL bootstrap (run in order)
│   ├── 00_bootstrap.sql             # Roles, auth schema/functions, extensions
│   ├── 01_schema.sql                # Tables, data, grants, RLS policies
│   ├── 02_auth_tokens.sql           # API tokens + password reset tokens
│   └── 03_demo_passwords.sql        # Demo account password hashes
├── docs/
│   └── DESIGN_SYSTEM.md             # Visual language and component rules
├── assets/brand/                    # Brand source assets
├── docker-compose.yml               # PostgreSQL + PostgREST
├── .env.example                     # Compose settings (values intentionally blank)
├── vercel.json                      # Vercel frontend config
├── DOCUMENTATION.md                 # Technical reference (security, API, test logins)
└── README.md
```

## Getting Started

### Prerequisites

- Docker + Docker Compose
- Node.js 18+
- PHP 8.3 with `pdo_pgsql` (or use `backend/bin/artisan` with the local
  extracted extension — see `backend/scripts/install-php-pgsql-local.sh`)
- Composer

### 1. Configure the environment

Copy the example files and generate the required secrets locally. The
`.env.example` files are the source of truth and contain placeholders and
intentionally blank secrets.

```bash
cd lms
cp .env.example .env
cp backend/.env.example backend/.env
cp client/.env.example client/.env

# Generate a random JWT secret and use the same value in lms/.env
# and backend/.env (PGRST_JWT_SECRET).
openssl rand -hex 32
```

Never commit a populated `.env` file. The repository ignores `.env` variants.

### 2. Start PostgreSQL and PostgREST

```bash
docker compose up -d
```

The first start runs `database/*.sql` in filename order. To rebuild the
database from scratch:

```bash
docker compose down -v
docker compose up -d
```

Check the stack:

```bash
docker compose ps
docker compose exec db psql -U postgres -d postgres -c '\dt public.*'
```

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

| Service      | Address           | Notes                                         |
| ------------ | ----------------- | --------------------------------------------- |
| PostgreSQL   | `127.0.0.1:5433`  | Local development container                   |
| PostgREST    | `127.0.0.1:54330` | Internal only; the browser never calls it     |
| Laravel API  | `127.0.0.1:8001`  | Bearer token from `/api/auth/login`           |
| Vite client  | `localhost:3000`  | Development server                            |

Local database role passwords are created by `database/00_bootstrap.sql` and
must match the values in `docker-compose.yml` and `backend/.env`. They are for
local development only: replace them, and the JWT secret, before deploying
anywhere shared.

### Demo data

`database/01_schema.sql` seeds demo cohorts, modules and accounts, and
`database/03_demo_passwords.sql` applies the demo password hashes. Demo test
logins are documented in [`DOCUMENTATION.md`](DOCUMENTATION.md#test-logins);
treat them as demo-only and remove or rotate them before any shared
deployment.

## Configuration

The example files document every supported variable. The values below are
placeholders; set real values only in your local or deployed `.env` files.

### `lms/.env` (Docker Compose)

| Variable           | Purpose                                              |
| ------------------ | ---------------------------------------------------- |
| `PGRST_JWT_SECRET` | Random 32+ byte secret shared with Laravel           |
| `LMS_DB_PORT`      | Host port for PostgreSQL (default `5433`)            |
| `LMS_REST_PORT`    | Host port for PostgREST (default `54330`)             |

### `backend/.env`

| Variable                | Purpose                                                       |
| ----------------------- | ------------------------------------------------------------- |
| `APP_URL`               | Laravel origin, e.g. `http://localhost:8001`                  |
| `DB_*`                  | PostgreSQL connection; `DB_PASSWORD` must match the local role |
| `POSTGREST_URL`         | Internal PostgREST origin                                     |
| `PGRST_JWT_SECRET`      | Must equal `lms/.env`                                         |
| `LMS_FRONTEND_URL`      | Frontend origin used in reset links                           |
| `LMS_TOKEN_TTL_MINUTES` | Bearer-token lifetime                                         |
| `LMS_RECOVERY_TTL_MINUTES` | Password-reset token lifetime                              |
| `CORS_ALLOWED_ORIGINS`  | Comma-separated allowed frontend origins                      |

### `client/.env`

| Variable       | Purpose                                             |
| -------------- | --------------------------------------------------- |
| `VITE_API_URL` | API base path; `/api` in development                |

> Vite variables are compiled into the browser bundle. Never place a secret in
> a `VITE_*` variable.

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
| ------ | ---- | ------- |
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
query surface the pages already use (`from`, `select`, `eq`, `in`, `not`, `is`,
`gte`, `lte`, `order`, `limit`, `single`, `maybeSingle`, `insert`, `update`,
`upsert`, `delete`, `rpc`, `auth.*`, `functions.invoke`).

## Security

- **Never commit `.env` files, tokens, passwords, private keys or API keys.**
  Use the checked-in `.env.example` files for documentation only.
- **PostgreSQL RLS is the authorization authority.** Do not bypass it from the
  client or by using a service-role token for client data.
- **Never place secrets in `VITE_*` variables.** They are compiled into the
  browser bundle.
- **Column grants protect sensitive fields.** `users.password`,
  `labs.solution_code` and `assessment_questions.correct_answer` are not
  readable by client roles.
- **Demo accounts are for local evaluation.** Remove or rotate them before any
  shared deployment.
- **Rotate credentials before deployment.** Change the local database role
  passwords, generate a fresh `PGRST_JWT_SECRET`, and rotate any exposed token.
- **Report security issues privately** to the BlueSPACE engineering team rather
  than opening a public issue.

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
5. Rotate every development password, the JWT secret and any demo credentials.
   Keep production secrets in the hosting provider's secret store.

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

## Documentation

- [`DOCUMENTATION.md`](DOCUMENTATION.md) — architecture, database schema,
  security model, API, provisioning and test logins.
- [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) — visual language, layout
  rules and component conventions.

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

## Contributing

See `DOCUMENTATION.md` §12 Contributing. Keep changes inside the design-system
rules, add database changes as new sequential files, and never commit
credentials or populated environment files.

## License

Private — BlueSPACE Internal.
