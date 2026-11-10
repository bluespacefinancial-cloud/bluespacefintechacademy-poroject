# BlueSPACE Fintech Academy LMS

Learning management system for the BlueSPACE Fintech Academy, training Finsoft
and FinOps Fellows across the AI Fintech Factory domains: **FaaS**,
**FinCore**, **FinOps** and **FinInfra**.

## What it does

The academy runs cohort-based programmes with separate portals for every role:

- **Students** work through modules and lessons, track progress, submit labs
  and assessments, complete a capstone, earn certificates, and browse the
  partner course catalogue.
- **Instructors** review submissions, run live classes and mentor clinics, and
  follow cohort progress.
- **Administrators** manage applications, accounts, cohorts, squads and
  programme content.
- **Partners** manage their organisation's courses and lessons in the partner
  catalogue.

Modules, lessons and progress are organised by cohort, stage and domain, with a
bookshelf-style module selector on the student learning page.

## How it works

The React client talks only to the Laravel API. Laravel authenticates users with
opaque bearer tokens and proxies data requests to PostgREST using short-lived
signed JWTs. PostgreSQL row-level security and column-level grants decide what
each role can read and write, so the browser never talks to the database or
receives a database role claim.

## Tech stack

- React 18, Vite, Tailwind CSS, shadcn/ui
- Laravel 13 API with opaque bearer tokens
- PostgREST as the internal data API
- PostgreSQL 17 with row-level security
- Docker Compose for the local stack

## Documentation

- [`DOCUMENTATION.md`](DOCUMENTATION.md) — local setup, architecture, database,
  security model, API reference, provisioning and test logins.
- [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) — visual language, layout
  rules and component conventions.

Never commit real credentials. See the security notes in `DOCUMENTATION.md`
before deploying.

## License

Private — BlueSPACE Internal.
