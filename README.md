# SwingAdmin

Golf tournament management system: an admin panel for organizers and a public, bilingual registration flow for employees and sponsors, with online payments.

**Live demo:** https://swing-admin-xi.vercel.app · **Case study:** https://magib.tech/projects/swing-admin

> Solo project by [Magib Biteye](https://magib.tech): requirements, database design, front end, back end, tests and deployment.

## Highlights

- **180 unit tests** (Vitest, v8 coverage) across validations, server actions, Stripe utilities and email templates
- **Role-based access control**: `super_admin` and `admin` roles, credentials sign-in with NextAuth.js v5 (JWT sessions), bcrypt password hashing
- **Payments**: Stripe Checkout with webhook handling
- **Bilingual EN/FR** end to end with next-intl, including confirmation emails (Resend)
- **Validated inputs**: Zod v4 schemas on the tournament, registration, sponsorship-tier and user server actions
- **Relational data model**: tournaments, teams, players, registrations, sponsorship tiers and sponsorships in PostgreSQL via Drizzle ORM

## Features

- **Tournament management**: create, edit, delete, search and filter; open or close registration
- **Teams**: create teams, assign players, move players between teams
- **Sponsorship tiers**: CRUD with quota tracking, reordering and progress bars
- **Public registration**: multi-step forms for employees (3 steps) and sponsors (4 steps)
- **Payments and email**: Stripe Checkout and Resend confirmations, both optional (the app logs to the console when keys are missing)
- **Admin users**: user management restricted to `super_admin`
- **CSV export**: tournament lists and details with teams and players
- **Responsive**: mobile menu, sidebar on tablet and desktop

## Architecture

```
Browser ── Next.js 16 App Router (React Server Components, next-intl routing /en, /fr)
              │
              ├── Server Actions ── Zod validation + role checks (NextAuth.js v5, JWT)
              │        │
              │        └── Drizzle ORM ── PostgreSQL (Neon in production)
              │
              ├── /api/auth           NextAuth credentials provider
              └── /api/webhooks       Stripe webhook (payment confirmation)
                                        └── Resend (bilingual confirmation emails)
```

### Technical decisions

| Decision | Why |
| --- | --- |
| Server Actions instead of a separate REST API | Mutations live next to the UI that uses them, with typed inputs and one validation layer (Zod) |
| Drizzle ORM over Prisma | Lighter runtime, SQL-like queries, strong TypeScript inference |
| NextAuth.js v5 with JWT sessions | First-class App Router support, no session table needed |
| `proxy.ts` (Next.js 16) for route protection | Locale routing and admin-area protection in one place |
| Optional Stripe and Resend | The app runs end to end locally without third-party keys |

## Tech stack

Next.js 16 (Turbopack) · TypeScript (strict) · Tailwind CSS 4 · shadcn/ui · Drizzle ORM · PostgreSQL (Neon) · NextAuth.js v5 · Stripe · Resend · next-intl · Zod v4 · Vitest

## Getting started

Requires Node.js 20.9+, pnpm and PostgreSQL 14+.

```bash
pnpm install
cp .env.example .env.local   # fill in DATABASE_URL and NEXTAUTH_SECRET at minimum
pnpm db:push                 # create the schema
pnpm db:seed                 # admin user, a sample tournament and sponsorship tiers
pnpm dev
```

The seed creates a `super_admin` account (`admin@swingadmin.com`). Its password comes from `SEED_ADMIN_PASSWORD`; without it, a local development default is used, so always set it for a shared or deployed database.

### Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Yes | Random 32-byte base64 string |
| `NEXTAUTH_URL` | Dev only | `http://localhost:3000` |
| `SEED_ADMIN_PASSWORD` | For deployed DBs | Password for the seeded admin account |
| `STRIPE_SECRET_KEY` | No | Stripe test or live secret key |
| `STRIPE_PUBLISHABLE_KEY` | No | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | No | Stripe webhook signing secret |
| `RESEND_API_KEY` | No | Resend API key for emails |
| `EMAIL_FROM` | No | Sender email address |

### Scripts

```bash
pnpm dev            # Development server (Turbopack)
pnpm build          # Production build
pnpm lint           # ESLint
pnpm test           # Vitest (watch)
pnpm test:run       # Single run
pnpm test:coverage  # With v8 coverage report
pnpm db:push        # Push schema to the database
pnpm db:seed        # Seed the database
pnpm db:studio      # Drizzle Studio
```

## Exploring the app locally

| Area | URL | What to try |
| --- | --- | --- |
| Public registration | `/` | Employee or sponsor registration flow |
| Admin login | `/en/login` | Sign in with the seeded admin account |
| Dashboard | `/en/dashboard` | Stats pulled from the database |
| Tournaments | `/en/tournaments` | CRUD, registration toggle, CSV export |
| Teams | `/en/teams` | Assign and move players |
| Sponsorships | `/en/sponsorships` | Tiers, ordering, quotas |
| Users | `/en/users` | Admin user management (`super_admin` only) |
| French | `/fr/...` | Same pages in French |

The public demo shows the registration side; admin access to the demo is shared on request.

## Project structure

```
src/
  app/
    [locale]/(admin)/    Admin pages (dashboard, tournaments, users, teams)
    [locale]/(auth)/     Login page
    [locale]/(public)/   Public registration and payment pages
    api/                 Auth and Stripe webhook routes
  components/
    admin/               Admin components (sidebar, header, forms)
    registration/        Public registration form components
    ui/                  shadcn/ui components
  lib/
    actions/             Server actions + their tests
    auth/                NextAuth configuration
    db/                  Drizzle schema, client, seed
    email/               Resend client and email templates
    stripe/              Stripe helpers and checkout
    validations/         Zod schemas
  messages/              Translations (en.json, fr.json)
```

More detail in [docs/](docs/): [API](docs/API.md), [database schema](docs/DATABASE.md), [setup](docs/SETUP.md), [development log](docs/PROGRESS.md).

## Known limitations

- No read-only demo role yet, so admin access to the public demo is not shared openly
- Tests are unit tests; the registration and payment flow has no end-to-end tests yet

## Next steps

- Read-only demo role so visitors can explore the admin panel safely
- End-to-end tests (Playwright) for registration and payment

## Deployment

Deployed on Vercel with a Neon PostgreSQL database.
