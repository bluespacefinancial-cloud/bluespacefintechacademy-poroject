# Archive

This folder contains material from earlier iterations of the academy. It is
kept for historical reference and must not be used to set up or operate the
current system.

## `legacy-supabase/`

`sql-to-run/` contains the old Supabase SQL editor instructions used before the
academy moved to a self-hosted PostgreSQL + Laravel + PostgREST stack. Those
scripts reference the former hosted project and its `auth` schema. Do not run
them against the current database.

The current source of truth is [`../../database/`](../../database/):

- `00_bootstrap.sql`
- `01_schema.sql`
- `02_auth_tokens.sql`
- `03_demo_passwords.sql`

## `legacy-scripts/`

`generate_certificate.py` is the original standalone certificate generator. The
maintained version lives at
[`../../backend/scripts/certificate_generator.py`](../../backend/scripts/certificate_generator.py)
and resolves the brand assets from `assets/brand/` and
`backend/public/images/`.

## Policy

- Do not add new files here unless they are genuinely historical.
- Do not link to this folder from setup or run instructions.
- If a legacy file is still required, move it to the active tree and document
  it in the root README instead.
