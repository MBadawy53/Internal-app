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

| Role               | Name          | Username (email)           | Password    |
| ------------------ | ------------- | -------------------------- | ----------- |
| Relationship Mgr   | Yara Mansour  | `yara.mansour@contact.eg`  | `Demo@2026` |
| Credit             | Tarek Fouad   | `tarek.fouad@contact.eg`   | `Demo@2026` |
| Legal              | Mona Adel     | `legal@contact.eg`         | `Demo@2026` |
| Finance            | Omar Khalil   | `omar.khalil@contact.eg`   | `Demo@2026` |
| FRA Validation     | Nadia Saleh   | `nadia.saleh@contact.eg`   | `Demo@2026` |
| Division Committee | Hany Greiss   | `committee@contact.eg`     | `Demo@2026` |
| Administrator      | System Admin  | `admin@contact.eg`         | `Demo@2026` |

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

## Resetting the demo

State is in-memory. **Refresh the page** to reset to the seeded data set.

## Notes

- These users are **demo-only** (mock auth). For production, wire SSO/AD for
  internal users and an OTP provider for clients — see `docs/INTEGRATION.md`.
- The credentials are defined in `src/lib/portal/engine.js` (`DEMO_USERS`).
