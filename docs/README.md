# Documentation

| Document | Description |
|----------|-------------|
| [../README.md](../README.md) | Product overview, architecture, setup, demo accounts and API reference |
| [../DEVELOPER_GUIDE.md](../DEVELOPER_GUIDE.md) | Technical guide: database, security, API, client integration and operations |
| [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) | Visual language, tokens, layout rules and component conventions |
| [plans/](plans/) | Strategic and phased delivery plans |
| [examples/](examples/) | Generated examples and reference output |
| [archive/](archive/) | Historical Supabase-era material, kept for reference only |

## Reading order

1. **New to the project** — start with the root [README](../README.md), then
   run the local stack.
2. **Frontend work** — read the [design system](DESIGN_SYSTEM.md) before
   changing layout or components.
3. **Backend, database or security work** — read the
   [developer guide](../DEVELOPER_GUIDE.md), especially the security model.
4. **Deployment** — use the deployment checklist in the developer guide.

## Documentation rules

- Keep the architecture, ports and credentials in the root README aligned with
  `docker-compose.yml`, `backend/.env.example` and `client/.env.example`.
- Record new database changes as a new sequential file in `database/`; never
  rewrite a file that has already been applied.
- Update the design system when a token, shell rule or shared component
  changes.
