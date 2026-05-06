# Contact Financial — Internal Employee Portal

Production-grade internal portal for **Contact Financial Holding** (Egyptian non-banking financial services). Employees browse the catalog, calculate installments, generate referral QR codes, capture leads from a public landing page, refer leads across business lines, and track every lead's lifecycle.

This repository follows a **phased build**. Phase 1 (foundation) is complete; later phases add catalog, calculator, leads, QR, notifications, reports, and CRM/core-banking integration scaffolds.

> **Status:** Phase 1 — Foundation ✅

---

## Stack

| Layer     | Choice                                        |
| --------- | --------------------------------------------- |
| Framework | Next.js 15 (App Router) + TypeScript (strict) |
| Database  | PostgreSQL 16                                 |
| ORM       | Prisma 5                                      |
| Auth      | Auth.js v5 (Credentials; SSO/AD-ready)        |
| UI        | Tailwind CSS + shadcn/ui primitives           |
| i18n      | next-intl (EN + AR, full RTL)                 |
| Money     | Stored as `BigInt` piastres (1 EGP = 100)     |

Brand palette is logo-accurate: deep blue `#2E2C8A` primary, orange `#F39200` accent, yellow `#FFD400` highlight.

---

## Local development

### Prerequisites

- Node.js ≥ 20.11
- pnpm ≥ 9
- Docker + Docker Compose

### 1. Bring up Postgres, Redis, Mailhog

```bash
docker compose up -d
```

- Postgres → `localhost:5432` (`contact` / `contact`)
- Redis → `localhost:6379`
- Mailhog UI → http://localhost:8025

### 2. Configure environment

```bash
cp .env.example .env
# Generate AUTH_SECRET and APP_ENCRYPTION_KEY:
openssl rand -hex 32   # → AUTH_SECRET
openssl rand -hex 32   # → APP_ENCRYPTION_KEY (must be 64 hex chars)
```

### 3. Install, migrate, seed

```bash
pnpm install
pnpm db:migrate     # runs Prisma migrate dev
pnpm db:seed        # 8 business lines, 1 admin + per-BL owner/manager/2 employees, sample products & leads
```

### 4. Run

```bash
pnpm dev            # http://localhost:3000
```

### Default credentials (dev only)

| Role         | Email                                                           | Password        |
| ------------ | --------------------------------------------------------------- | --------------- |
| Admin        | `admin@contact.local`                                           | `ChangeMe!2026` |
| BL Owner     | `owner.<bl-slug>@contact.local`                                 | `Welcome!2026`  |
| Team Manager | `manager.<bl-slug>@contact.local`                               | `Welcome!2026`  |
| Employee     | `emp1.<bl-slug>@contact.local` / `emp2.<bl-slug>@contact.local` | `Welcome!2026`  |

Business line slugs: `auto-loan`, `insurance`, `mortgage`, `home-furniture`, `home-interior`, `motorcycle`, `leasing`, `factoring`.

---

## Scripts

| Command           | Description               |
| ----------------- | ------------------------- |
| `pnpm dev`        | Run dev server            |
| `pnpm build`      | Production build          |
| `pnpm start`      | Run production build      |
| `pnpm lint`       | ESLint                    |
| `pnpm typecheck`  | TypeScript strict no-emit |
| `pnpm test`       | Vitest unit + integration |
| `pnpm test:e2e`   | Playwright E2E            |
| `pnpm db:migrate` | Prisma migrate (dev)      |
| `pnpm db:seed`    | Run seed                  |
| `pnpm db:studio`  | Open Prisma Studio        |

---

## Documentation

| Doc                                                | Purpose                                                 |
| -------------------------------------------------- | ------------------------------------------------------- |
| [`docs/architecture.md`](./docs/architecture.md)   | System diagram, layering, data flow                     |
| [`docs/data-model.md`](./docs/data-model.md)       | ERD + field-by-field reference                          |
| [`docs/permissions.md`](./docs/permissions.md)     | Full RBAC matrix                                        |
| [`docs/state-machine.md`](./docs/state-machine.md) | Lead state machine                                      |
| [`docs/integrations.md`](./docs/integrations.md)   | What's stubbed, what's needed for real CRM/core banking |
| [`docs/i18n.md`](./docs/i18n.md)                   | Adding strings, RTL gotchas                             |

---

## Deploying

The app is provider-agnostic — anywhere that runs Next.js 15 and provides a Postgres `DATABASE_URL` works. Vercel + a managed Postgres (Vercel Postgres, Supabase, Railway, etc.) is the most common combo, but a self-hosted VPS with `docker compose up -d` works too.

### 1. Provision a Postgres database

Pick one:

- **Vercel Postgres** — Vercel dashboard → Storage → Create. Copy the `DATABASE_URL`.
- **Supabase** — supabase.com → New project → Settings → Database → URI (pooler).
- **Railway** — railway.app → New → Postgres → Variables → `DATABASE_URL`.
- **Self-hosted** — `docker compose up -d` from this repo.

### 2. Apply schema and seed

From your local machine:

```bash
DATABASE_URL="<your-postgres-url>" \
APP_ENCRYPTION_KEY="$(openssl rand -hex 32)" \
AUTH_SECRET="$(openssl rand -hex 32)" \
pnpm exec prisma db push --accept-data-loss

DATABASE_URL="<your-postgres-url>" pnpm db:seed
```

### 3. Import the repo on Vercel

1. https://vercel.com → **Add New** → **Project** → import `mbadawy53/internal-app`.
2. Framework preset: **Next.js** (auto-detected).
3. Set **Production Branch** to `main`.

### 4. Vercel environment variables

| Variable             | Value                                                                                        |
| -------------------- | -------------------------------------------------------------------------------------------- |
| `DATABASE_URL`       | The Postgres connection string from step 1                                                   |
| `AUTH_SECRET`        | Output of `openssl rand -hex 32`                                                             |
| `APP_ENCRYPTION_KEY` | Output of `openssl rand -hex 32` (64 hex chars) — **must match** the value used at seed time |
| `AUTH_TRUST_HOST`    | `true`                                                                                       |
| `APP_URL`            | `https://<your-project>.vercel.app`                                                          |
| `LOG_LEVEL`          | `info`                                                                                       |

The remaining vars in `.env.example` (Twilio, Resend, Turnstile, etc.) can be left unset until those features land in later phases.

### 5. Deploy

Click **Deploy**. The build runs `prisma generate && next build`. After the first deploy completes, the seeded admin (`admin@contact.local` / your seeded password) can log in.

### Updates

Every push to the production branch triggers a new deploy. Schema changes require an explicit `pnpm exec prisma db push` (or `migrate deploy`) against your `DATABASE_URL` before the deploy.

---

## Phase roadmap

- [x] **Phase 1 — Foundation:** Next.js scaffold, Tailwind+shadcn, next-intl EN+AR with RTL, Prisma schema, seed, Auth.js Credentials, RBAC, app shell, login, dashboard
- [ ] **Phase 2 — Catalog & Calculator**
- [ ] **Phase 3 — Leads core (state machine, referrals, export)**
- [ ] **Phase 4 — QR codes & public lead capture**
- [ ] **Phase 5 — Notifications (in-app, email, SMS, WhatsApp)**
- [ ] **Phase 6 — Analytics & Reports**
- [ ] **Phase 7 — CRM & Core Banking integrations**
- [ ] **Phase 8 — Hardening, audit log UI, accessibility, coverage**
