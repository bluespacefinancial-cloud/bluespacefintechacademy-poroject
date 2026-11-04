# BlueSPACE Fintech Academy LMS

Learning Management System for the BlueSPACE Fintech Academy, training Finsoft and Finops Fellows on the AI Fintech Factory domains (FaaS, FinCore, FinOps, FinInfra).

## Tech Stack

- **Frontend:** React 18 + Vite + Tailwind CSS + shadcn/ui
- **Backend:** Supabase (PostgreSQL + Auth + Edge Functions + Storage)
- **State/Auth:** React Context + Supabase JS client
- **Icons:** Lucide React
- **Animations:** Framer Motion
- **Notifications:** React Hot Toast

## Project Structure

```
lms/
├── client/                 # React frontend (deployed to Vercel)
│   ├── src/
│   │   ├── components/ui/     # shadcn/ui components
│   │   ├── components/MediaPlayer.jsx  # Video/audio player with progress tracking
│   │   ├── components/layout/   # AppLayout, Sidebar, ProtectedRoute
│   │   ├── context/           # AuthContext
│   │   ├── lib/               # Supabase client, API layer
│   │   ├── pages/             # Page components (Login, Dashboard, MyLearning, etc.)
│   │   ├── App.jsx            # App router
│   │   ├── main.jsx           # Entry point
│   │   └── index.css          # Global styles + design tokens
│   ├── supabase/              # Database schema
│   │   ├── schema.sql
│   │   └── storage.sql
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── supabase/                  # Edge Functions (deployed to Supabase)
│   ├── functions/
│   │   ├── auth-handler/
│   │   ├── lessons/
│   │   ├── submissions/
│   │   ├── placements/
│   │   └── reports/
│   ├── schema.sql
│   └── storage.sql
├── vercel.json                # Vercel deployment config
├── package.json
└── README.md
```

## Architecture

```
┌─────────────┐      HTTPS       ┌──────────────┐
│  Vercel     │◄─────────────────▶│  Supabase    │
│  (Frontend) │                  │  (Backend)   │
│             │                  │              │
│ React App   │                  │ PostgreSQL   │
│ Tailwind    │◀─────────────────│ Auth         │
│ shadcn/ui   │                  │ Edge Fn      │
│             │                  │ Storage      │
└─────────────┘                  └──────────────┘
```

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase account and project
- Vercel account (for frontend hosting)

### Installation

```bash
# Install dependencies
cd client && npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase URL and anon key

# Run development server
npm run dev
```

### Supabase Setup

1. Create a new Supabase project
2. Run `supabase/schema.sql` in the SQL Editor
3. Run `supabase/storage.sql` to create storage buckets
4. Run `supabase/migrations/001_phase_one_academy.sql` to add live classes and RLS policies
5. Run `supabase/migrations/002_academy_operations.sql` to add the direct Auth profile key and announcements
6. Run `supabase/migrations/003_student_squad_visibility.sql` to allow students to see their squad roster
7. Run `supabase/migrations/004_staff_learning_monitoring.sql` to allow staff read-only learning monitoring
8. Run `supabase/migrations/005_production_operations.sql` to secure squad, placement, and notification operations
9. Run `supabase/migrations/006_academy_v2_operations.sql` to add clinics, skills profiles, project evidence, peer reviews, mentor evaluations, and quiz attempts
10. Run `supabase/migrations/007_completion_workflows.sql` to add certificate verification and completion workflow support
11. Run `supabase/migrations/008_workflow_automation.sql` to add submission, grading, clinic, and project-review notifications
12. Run `supabase/migrations/009_staff_assignments.sql` to add instructor cohort and squad assignment records
13. Run `supabase/migrations/010_security_hardening.sql` to enable RLS on cohorts, labs and assessments, hide lab solutions and quiz answer keys, block deactivated accounts, and stop users from changing their own role
14. Deploy Edge Functions:
   ```bash
   npx supabase functions deploy
   ```
14. Copy your Supabase URL and anon key to `.env`

After migration 009, administrators can manage instructor boundaries from
`/instructor-assignments`. Create cohort and squad assignments before relying on
instructor-specific monitoring and mentor evaluation visibility.

Panel reviewers can approve a capstone and issue its certificate from the same
review screen. Issued certificates receive a verification number and public
verification token through the `issue_certificate` database function.

### Google Meet and Calendar

Live classes are free academy sessions, not paid products. The Phase 1 UI accepts a Google
Meet URL and stores Google Calendar/Meet identifiers for the server-side OAuth integration.
Configure Google OAuth and Calendar/Meet API credentials in Supabase Edge Function secrets;
never place client secrets or refresh tokens in Vite environment variables. The
`google_integrations` table provides server-side token storage fields for that integration.
Automatic event creation is not enabled until the OAuth Edge Function is deployed and
the required Google credentials and redirect URI are configured.

### Environment Variables

Create `client/.env`:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Deployment (Vercel + Supabase)

1. Push code to GitHub
2. Connect Vercel to your GitHub repo
3. Add environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy Edge Functions to Supabase:
   ```bash
   npx supabase functions deploy
   ```
5. Configure CORS in Supabase to allow your Vercel domain

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Auto-fix lint issues
- `npm run format` - Format with Prettier

## License

Private - BlueSPACE Internal
