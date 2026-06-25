# Integrating Contact's internal APIs

The portal ships with a typed, in-memory data layer so it runs without a back
end. Everything you need to change lives in **`src/lib/api/`**. The presentation
layer (`src/lib/portal/engine.js`) only ever calls the exported `api` object and
reads from the exported `store`, so integration is contained.

## The seam at a glance

```
src/lib/api/
├─ types.ts     # Domain contracts — map your API payloads onto these
├─ domain.ts    # Pure workflow logic (stage machine) — reuse as-is
├─ store.ts     # Mock seed data — DELETE after integration
├─ mock.ts      # Synchronous mock implementation — used today
├─ http.ts      # FactoringApi interface + fetch skeleton — IMPLEMENT THIS
└─ index.ts     # `export const api = mockApi`  ← flip to httpApi
```

## Steps

### 1. Implement `http.ts`

`http.ts` already declares the `FactoringApi` interface and a skeleton client
(`httpApi`) that calls `NEXT_PUBLIC_API_BASE_URL`. Adjust the paths and payloads
to match your gateway, and map responses onto the types in `types.ts`.

Suggested endpoint mapping:

| UI action                | `FactoringApi` method        | Suggested endpoint                  |
| ------------------------ | ---------------------------- | ----------------------------------- |
| List buyers              | `listBuyers()`               | `GET /buyers`                       |
| Buyer detail / limits    | `getBuyer(id)`               | `GET /buyers/:id`                   |
| List suppliers           | `listSuppliers()`            | `GET /suppliers`                    |
| Supplier detail          | `getSupplier(id)`            | `GET /suppliers/:id`                |
| List requests            | `listCases()`                | `GET /requests`                     |
| Request (case) detail    | `getCase(id)`                | `GET /requests/:id`                 |
| Notifications by role    | `listNotifications(role)`    | `GET /notifications?role=`          |
| Upload invoice → request | `createCase(input)`          | `POST /requests`                    |
| Advance a stage          | `advanceCase(id, ctx)`       | `POST /requests/:id/advance`        |
| Reject with reason       | `rejectCase(id, ctx)`        | `POST /requests/:id/reject`         |
| Escrow acknowledgement   | `acknowledgeEscrow(id, ctx)` | `POST /requests/:id/escrow-ack`     |
| Settle at maturity       | `settleCase(id, ctx)`        | `POST /requests/:id/settle`         |
| Upload document          | `addDocument(id, ctx)`       | `POST /requests/:id/documents`      |

> The workflow rules (which stage comes next, conditional buyer-validation and
> committee stages, automated FRA routing) live in `domain.ts`. If your back end
> owns the state machine, return the updated request from `advanceCase` and the
> UI will reflect it; otherwise you can keep using `domain.ts` client-side.

### 2. Flip the switch in `index.ts`

```ts
// import { mockApi } from './mock';
import { httpApi } from './http';

export const api = httpApi;
```

### 3. Make the UI call sites async

The mock API is synchronous; the real one is async. In
`src/lib/portal/engine.js` search for **`🔌 SWAP`** — there are six mutation
helpers (`advanceCase`, `confirmReject`, `ackEscrow`, `confirmSettle`,
`confirmDoc`, `submitInvoice`). Convert each to `await` the API call, e.g.:

```js
async function advanceCase(id, note){
  const res = await api.advanceCase(id, { actor: actorLabel(), note });
  if (!res) { toast('No further stage.','warn','ℹ️'); return; }
  /* …toasts + re-render unchanged… */
}
```

For reads, the views currently use the seeded `store`. Either:
- hydrate `store` once on boot from `api.list*()` (smallest change), or
- migrate individual views to call `api.get*()` directly.

### 4. Authentication

The prototype login (`renderAuth` in `engine.js`) is a UI mock (Operations
email/password and Client mobile/OTP tabs). Wire it to Contact SSO / AD for
internal users and the OTP provider for clients; on success it calls
`enterApp()`. RBAC is expressed per role in the `NAV` and permissions matrix —
enforce it server-side as well.

### 5. Remove the mock

Once `httpApi` is live, delete `src/lib/api/store.ts` and the `mock.ts`
re-export. TypeScript will flag any remaining references.

## Environment

| Variable                   | Purpose                                    |
| -------------------------- | ------------------------------------------ |
| `NEXT_PUBLIC_API_BASE_URL` | Base URL used by `http.ts` (`/api` default)|

If you prefer to keep secrets server-side, add Next.js route handlers under
`src/app/api/**` that proxy to internal services, and point
`NEXT_PUBLIC_API_BASE_URL` at `/api`.
