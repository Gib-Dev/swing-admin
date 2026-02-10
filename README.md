# SwingAdmin

Golf tournament management system with admin panel and public registration.

**Live:** https://swing-admin-xi.vercel.app

## Features

- **Tournament Management** -- Create, edit, delete tournaments with search and filtering
- **Team Management** -- Create teams, assign players, move players between teams
- **Sponsorship Tiers** -- CRUD with quota tracking, reordering, and progress bars
- **Public Registration** -- Multi-step employee (3 steps) and sponsor (4 steps) forms
- **Payments** -- Stripe Checkout integration with webhook handling (optional)
- **Email** -- Registration confirmation emails via Resend (optional, falls back to console)
- **Admin Users** -- Role-based access control (super_admin vs admin)
- **CSV Export** -- Tournament list and detail exports with teams and players
- **Bilingual** -- Full English and French support (next-intl)
- **Responsive** -- Mobile hamburger menu, tablet and desktop sidebar

## Tech Stack

- Next.js 16 (Turbopack), TypeScript (strict), Tailwind CSS 4
- shadcn/ui components, Lucide icons
- Drizzle ORM, PostgreSQL (Neon in production)
- NextAuth.js v5 (JWT, credentials provider)
- Stripe (payments), Resend (email)
- Zod v4 (validation), next-intl (i18n)
- Vitest (180 tests, v8 coverage)

## Getting Started

### Prerequisites

- Node.js 20.9+
- pnpm
- PostgreSQL 14+

### Setup

```bash
# Install dependencies
pnpm install

# Copy environment file and fill in values
cp .env.example .env.local

# Push database schema
pnpm db:push

# Seed admin user and sample data
pnpm db:seed

# Start dev server
pnpm dev
```

Default admin login: `admin@swingadmin.com` / `admin123!`

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Yes | Random 32-byte base64 string |
| `NEXTAUTH_URL` | Dev only | `http://localhost:3000` |
| `STRIPE_SECRET_KEY` | No | Stripe test/live secret key |
| `STRIPE_PUBLISHABLE_KEY` | No | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | No | Stripe webhook signing secret |
| `RESEND_API_KEY` | No | Resend API key for emails |
| `EMAIL_FROM` | No | Sender email address |

Stripe and Resend are optional -- the app logs to console when keys are missing.

## Scripts

```bash
pnpm dev          # Development server (Turbopack)
pnpm build        # Production build
pnpm lint         # ESLint
pnpm test         # Run tests (Vitest)
pnpm db:push      # Push schema to database
pnpm db:seed      # Seed database
pnpm db:studio    # Open Drizzle Studio
```

## Project Structure

```
src/
  app/
    [locale]/(admin)/    Admin pages (dashboard, tournaments, users, teams)
    [locale]/(auth)/     Login page
    [locale]/(public)/   Public registration and payment pages
    api/                 Auth and webhook API routes
  components/
    admin/               Admin components (sidebar, header, forms)
    registration/        Public registration form components
    ui/                  shadcn/ui components
  lib/
    actions/             Server actions (tournament, team, registration, export)
    auth/                NextAuth configuration
    db/                  Drizzle schema, config, seed
    email/               Resend client and email templates
    stripe/              Stripe helpers and checkout
    validations/         Zod schemas
  messages/              i18n translation files (en.json, fr.json)
```

## Deployment

Deployed on Vercel with Neon PostgreSQL. See [docs/PROGRESS.md](docs/PROGRESS.md) for full development history.

## License

Private.
