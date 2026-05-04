# Architecture

## System overview

```
┌─────────────────────────────┐         ┌──────────────────────┐
│  Internal portal (auth req) │         │  Public lead capture │
│  /(portal)/* — RSC + actions│         │  /(public)/r/[code]  │
└──────────────┬──────────────┘         └──────────┬───────────┘
               │                                    │
               ▼                                    ▼
        ┌────────────────────────────────────────────────────┐
        │                Next.js 15 (App Router)             │
        │   Server Actions  ·  API routes  ·  middleware     │
        └────────────────┬───────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────┐  ┌────────────────────────┐
        │  Services  (pure business)     │  │ Integration adapters   │
        │  no Prisma, no fetch           │  │ (CRM, Core Banking,    │
        └─────────┬──────────────────────┘  │  SMS, WhatsApp, Email) │
                  │                          └──────────┬─────────────┘
                  ▼                                     ▼
        ┌──────────────────┐               ┌──────────────────────────┐
        │ Repositories     │               │ External vendors          │
        │ (Prisma access)  │               │ (stubbed in Phase 1–6)    │
        └────────┬─────────┘               └──────────────────────────┘
                 ▼
            PostgreSQL
```

## Layering rules

1. **UI never imports Prisma.** UI calls Server Actions / API routes.
2. **Server Actions** validate input with Zod, run RBAC via `requirePermission`, then call services.
3. **Services** contain business logic. No Prisma, no fetch — just calls into repositories and adapters.
4. **Repositories** are the only place Prisma is imported.
5. **Integration adapters** are the only place outbound `fetch` lives. Each lives behind a typed interface so vendors can be swapped.

## Cross-cutting concerns

- **AuthZ:** `src/lib/auth/rbac.ts` is the single source of truth. Every mutation/query checks via `requirePermission` and receives a row scope (`own | team | businessLine | all`).
- **i18n + RTL:** `next-intl` middleware sets locale per user; `dir` attribute set in `RootLayout`; Tailwind `rtl:` variants used for directional tweaks.
- **Money:** `BigInt` piastres. No floats anywhere in finance code.
- **Encryption:** AES-256-GCM via `src/lib/crypto/aes-gcm.ts`. Single key from `APP_ENCRYPTION_KEY`.
- **State machine:** Lead transitions in `src/lib/leads/state-machine.ts` (Phase 3) — pure module, transitions enforced server-side, every move audited in `LeadStatusHistory`.
- **Audit:** Mutating actions write `AuditLog` rows (Phase 3+).
- **Logging:** `pino`, redacts secrets and credentials.
- **Rate limiting:** Public lead-capture form throttled by IP. Upstash Redis in prod, DB-backed `RateLimitBucket` fallback in dev.

## Public surface

The only unauthenticated route is `/r/[code]`. Hardening (Phase 4): Turnstile + honeypot + rate limit + Zod validation + audit.
