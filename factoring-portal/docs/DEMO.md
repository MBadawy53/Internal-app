# Demo phase — test users & cycle walkthrough

The portal ships with a **mock auth layer** for demos: no real credentials are
checked. You can sign in as any role and drive a financing request through the
entire workflow.

> Run it: `cd factoring-portal && npm install && npm run dev` → http://localhost:3000

## Two separate login pages

The landing screen offers two distinct sign-in experiences (you can also deep-link straight to either):

- **Employee Portal** — internal staff (RM, Credit, Legal, Finance, FRA, Committee, Admin), email + password. Deep link: `…/factoring-demo.html#employee`
- **Client Portal** — Buyers & Suppliers, mobile + OTP. Deep link: `…/factoring-demo.html#client`

Each portal has a **"Quick demo login"** panel with one-click buttons for its
users. To switch user, **Logout** (profile menu) and pick another.

## Test accounts — usernames & passwords

### Employee Portal — username = email, password = `Demo@2026`

| Role                | Name         | Username (email)          | Password    | Capability |
| ------------------- | ------------ | ------------------------- | ----------- | ---------- |
| Relationship Mgr    | Walaa Yusuf  | `walaa.yusuf@contact.eg`  | `Demo@2026` | Create/maintain profiles, upload invoices, resubmit returned profiles |
| Credit Officer      | Pierre       | `pierre@contact.eg`       | `Demo@2026` | Obligor override/reject, execution validation, profile approve/return |
| Legal Officer       | Doaa Orfy    | `doaa.orfy@contact.eg`    | `Demo@2026` | Profile legal approve/return |
| Finance Viewer      | Emad Ashour  | `emad.ashour@contact.eg`  | `Demo@2026` | **View-only** — no actions (funding/settlement happen in the Finance system and sync via integration) |
| Administrator       | System Admin | `admin@contact.eg`        | `Demo@2026` | Full access; also simulates the Finance/FRA integration steps in testing |

> **FRA** is **not** a user/login — it is an automated external stage handled by
> another system; in the demo it is auto-passed (bypassed). **Finance** updates
> (funding, settlement) are performed in the Finance team's own system and would
> sync in via integration; for testing, the **Administrator** account simulates
> those steps. The **Deviation Committee** stage remains for concentration
> exceedances (conditional).

### Client Portal — username = mobile, OTP = `202611`

| Type     | Company               | Username (mobile)    | OTP      | Model                |
| -------- | --------------------- | -------------------- | -------- | -------------------- |
| Buyer    | Carrefour Egypt       | `+20 100 118 2420`   | `202611` | reverse (anchor)     |
| Buyer    | Pepsi Egypt           | `+20 122 203 8170`   | `202611` | reverse (anchor)     |
| Supplier | BIM Stores            | `+20 100 771 2040`   | `202611` | reverse              |
| Supplier | Awlad Ragab           | `+20 111 559 0170`   | `202611` | normal · disclosed   |
| Supplier | Super Market El Hamd  | `+20 100 882 1400`   | `202611` | normal · silent      |

> The OTP is pre-filled and any 6-digit value is accepted (mock auth). The
> password field is likewise not verified — it's a demo.

## Walkthrough A — Reverse, supplier-initiated, concentration → full cycle

This mirrors BRD §9.1 (BIM → Carrefour). Use Quick demo login to switch users.

1. **Supplier — BIM Stores:** *Upload Invoice* → submit. It enters **Buyer Validation**.
2. **Buyer — Carrefour Egypt:** *Pending Validation* → open the request → confirm
   goods received / no dispute / commit to pay. FRA validation auto-passes.
   - If you instead open the seeded **INV-2026-0444** (EGP 5.4M), concentration is
     flagged and it routes to the **Division Committee**.
3. **Division Committee — Hany Greiss:** *Concentration Review* → open → allocate /
   approve → routes to Credit. *(only for concentration-flagged requests)*
4. **Credit — Tarek Fouad:** *Credit Review* → open → approve → **Approved**.
5. **Finance — Omar Khalil:** *Funding & Settlement* → open → **Fund** (instant
   SWIFT toast) → then **Settle with bank** (upload proof) → **Settled** → **Close**.
6. **RM — Yara Mansour / Admin:** *Audit Logs* → see every step recorded.

> Tip: each role's sidebar badges show how many items await it, so you always
> know where the request is in the chain.

## Walkthrough B — Normal (recourse), silent, escrow

Mirrors BRD §9.2 (El Hamd → El Far).

1. **Supplier — Super Market El Hamd:** *Upload Invoice* (silent) → submit. No
   buyer validation; FRA auto-passes; if concentration is within policy the
   committee stage is skipped.
2. **Supplier — El Hamd:** *Escrow Acknowledgements* → sign the escrow
   acknowledgement (required for silent factoring).
3. **Credit → Finance:** approve → fund (SWIFT) → settle via escrow → close, as above.
4. Try the seeded **INV-2026-0486** (EGP 2.4M, funded, ack pending) to jump in mid-cycle.

## Walkthrough C — Profile approval with the Credit/Legal "Modified" loop (v0.3)

Mirrors the requested rework cycle: RM creates a profile → **Credit** then **Legal**
review → either can **return to RM** → RM **updates & resubmits** → it reappears
in the Credit/Legal queue as **"Modified"** for re-review.

1. **Credit — Tarek Fouad:** open **Profile Approvals** → pick a pending profile
   (e.g. *Pepsi Egypt*) → **Return to RM** (or Approve to route it to Legal).
2. **RM — Yara Mansour:** open **Profile Approvals** → the returned profile shows
   **"Returned to RM"** → click **Update & resubmit (Modified)**. Missing docs are
   provided and it goes back to the queue.
3. **Credit / Legal:** the profile now shows status **"Modified"** in the queue →
   open it and **Approve** or **Return** again. Credit-approve routes to **Legal**;
   Legal-approve activates the profile.

## Resetting the demo

State is in-memory. **Refresh the page** to reset to the seeded data set.

## Notes

- These users are **demo-only** (mock auth). For production, wire SSO/AD for
  internal users and an OTP provider for clients — see `docs/INTEGRATION.md`.
- The credentials are defined in `src/lib/portal/engine.js` (`DEMO_USERS`).
