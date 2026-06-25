# Contact Factoring — Digital Factoring Portal

A bilingual (EN/AR, full RTL) web portal for Contact Factoring's **Digital
Factoring** solution, covering **reverse (supply chain) factoring** and
**recourse (normal) factoring** end-to-end: onboarding, invoice submission
(single & bulk), buyer validation, automated FRA validation, division-committee
concentration review, credit review, funding (instant SWIFT), settlement,
closure, plus a dedicated **Limit Management** module and a full audit trail.

This is a standalone **Next.js 15 + TypeScript** application built from the
approved HTML prototype and the *Digital Factoring BRD v0.2*. It runs today on
an in-memory mock data layer, with a **typed API seam** designed to be wired to
Contact's internal APIs — see [`docs/INTEGRATION.md`](./docs/INTEGRATION.md).

> Status: prototype-faithful UI + typed data layer, ready for back-end integration.

---

## Stack

| Layer      | Choice                                             |
| ---------- | -------------------------------------------------- |
| Framework  | Next.js 15 (App Router) + React 19 + TypeScript    |
| Styling    | Hand-authored design-token CSS (`globals.css`)     |
| Data layer | Typed `lib/api` — mock now, swappable to HTTP      |
| Deployment | Vercel (zero-config) or Docker (standalone output) |

Brand palette is logo-accurate: deep blue `#282880`, orange `#F6801F`,
yellow `#FBB833`. Light/dark themes and accent options are built in.

---

## Quick start

```bash
cd factoring-portal
cp .env.example .env.local        # optional until you wire the real API
npm install
npm run dev                       # http://localhost:3000
```

Other scripts:

| Command            | Description                          |
| ------------------ | ------------------------------------ |
| `npm run dev`      | Dev server                           |
| `npm run build`    | Production build (standalone output) |
| `npm run start`    | Run the production build             |
| `npm run typecheck`| TypeScript, no emit                  |
| `npm run lint`     | ESLint (engine excluded)             |

### Trying the workflow

The login screen has two tabs — **Operations** (internal staff) and **Clients**
(buyer/supplier). Any credentials work in the mock build; pick a role to explore
its tailored dashboard, queues and permissions. Use the **"View as"** role
switcher in the top bar to jump between RM, Buyer, Supplier, FRA, Division
Committee, Credit, Finance and Administrator without logging out.

Upload an invoice, then advance it through the pipeline to see automated FRA
routing, conditional buyer-validation / committee stages, instant-SWIFT funding,
silent-factoring escrow acknowledgement, settlement and closure — all recorded
in the audit trail.

---

## Project structure

```
factoring-portal/
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx          # root layout, fonts, <html> shell
│  │  ├─ page.tsx            # mounts the portal
│  │  └─ globals.css         # full design system (tokens, components, themes)
│  ├─ components/
│  │  └─ FactoringPortal.tsx # client mount: DOM scaffold + engine bootstrap
│  └─ lib/
│     ├─ api/                # ◀── THE INTEGRATION SEAM
│     │  ├─ types.ts         # domain contracts (Buyer, Supplier, Case, …)
│     │  ├─ domain.ts        # workflow state machine (stages, transitions)
│     │  ├─ store.ts         # in-memory mock seed data
│     │  ├─ mock.ts          # synchronous mock API (used today)
│     │  ├─ http.ts          # async FactoringApi contract + fetch skeleton
│     │  └─ index.ts         # one-line switch: mock ↔ real
│     └─ portal/
│        └─ engine.js        # ported UI/interaction engine (views, shell, auth)
├─ Dockerfile                # multi-stage, Next standalone
├─ vercel.json               # Vercel framework preset
└─ docs/INTEGRATION.md       # how to wire internal APIs
```

**Separation of concerns:** all data reads come from `lib/api`'s store and all
mutations are delegated to the `api` client. The presentation engine never talks
to a back end directly — so integration is isolated to `lib/api`.

---

## Deployment

### Vercel

1. Import the repo, set the project root to `factoring-portal/`.
2. Framework preset **Next.js** is auto-detected.
3. Set env var `NEXT_PUBLIC_API_BASE_URL` once the real API is ready.
4. Deploy.

### Docker

```bash
cd factoring-portal
docker build -t contact-factoring-portal .
docker run -p 3000:3000 -e NEXT_PUBLIC_API_BASE_URL=https://api.internal.contact.eg/factoring/v1 contact-factoring-portal
```

The image uses Next.js standalone output (small runtime, non-root user).

---

## Integrating internal APIs

The data layer is the only thing to change. In short:

1. Implement the `FactoringApi` methods in `src/lib/api/http.ts` against your
   endpoints.
2. Flip `export const api` in `src/lib/api/index.ts` from `mockApi` to `httpApi`.
3. Convert the call sites flagged `🔌 SWAP` in `src/lib/portal/engine.js` to
   `await` the now-async methods.
4. Delete `src/lib/api/store.ts` (seed data) when nothing references it.

Full mapping and request/response shapes: [`docs/INTEGRATION.md`](./docs/INTEGRATION.md).

---

## BRD coverage

Maps each portal area to the *Digital Factoring BRD v0.2* requirements:
[`docs/BRD-COVERAGE.md`](./docs/BRD-COVERAGE.md).
