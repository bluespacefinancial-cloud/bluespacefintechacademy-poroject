# BlueSPACE Fintech Academy LMS

Learning Management System for the BlueSPACE Fintech Academy, training Finsoft and Finops Fellows on the AI Fintech Factory domains (FaaS, FinCore, FinOps, FinInfra).

## Tech Stack

- **Frontend:** React 18 + Vite + Tailwind CSS
- **Backend:** Supabase (PostgreSQL) + Edge Functions
- **State/Auth:** React Context + Supabase JS client
- **Icons:** Lucide React
- **Animations:** Framer Motion
- **Notifications:** React Hot Toast

## Project Structure

```
lms/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/ui/     # Reusable UI components (Button, Card, Badge, Input, Select, Modal)
│   │   ├── components/layout/ # Layout components (AppLayout, Sidebar, ProtectedRoute)
│   │   ├── context/           # AuthContext
│   │   ├── lib/               # Supabase client, API layer
│   │   ├── pages/             # Page components (Login, DesignSystem)
│   │   ├── App.jsx            # App router
│   │   ├── main.jsx           # Entry point
│   │   └── index.css          # Global styles + design tokens
│   ├── supabase/              # Database schema
│   │   └── schema.sql
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── supabase/                  # LMS database schema (root copy)
│   └── schema.sql
├── package.json
└── README.md
```

## Design System

The LMS adapts the BlueSPACE HR System design language:

- **Typography:** Manrope, system-ui, sans-serif
- **Primary Color:** Brand Blue `#0000ff`
- **Neutral:** Deep Gray `#0f172a`
- **Domain Colors:** FaaS (indigo), FinCore (emerald), FinOps (amber), FinInfra (slate)
- **Spacing:** 4px grid (Tailwind default)
- **Motion:** ease-out-expo, 150/200/250ms durations

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase account and project

### Installation

```bash
# Install dependencies
npm run install:all

# Set up environment variables
cp client/.env.example client/.env
# Edit .env with your Supabase URL and anon key

# Run development server
npm run dev
```

### Supabase Setup

1. Create a new Supabase project
2. Run `supabase/schema.sql` in the Supabase SQL Editor
3. Copy your Supabase URL and anon key to `client/.env`

### Environment Variables

Create `client/.env`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Auto-fix lint issues
- `npm run format` - Format with Prettier

## Phased Implementation

See `BLUESPACE_LMS_PHASED_PLAN.md` for the 7-phase implementation roadmap.

## License

Private - BlueSPACE Internal
