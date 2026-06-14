# Demo phase — test users & cycle walkthrough

The portal ships with a **mock auth layer** for demos: no real credentials are
checked. You can sign in as any role and drive a financing request through the
entire workflow.

> Run it: `cd factoring-portal && npm install && npm run dev` → http://localhost:3000

## Fastest path — Quick demo login

On the sign-in screen there's a **"Quick demo login"** panel with one-click
buttons for every role (Internal teams + Clients). Click any button to enter as
that user instantly. You can also use the **"View as"** switcher in the top bar
to jump between roles without signing out.

## Test users (if you prefer typing credentials)

### Internal teams — *Operations* tab
Shared demo password: **`Demo@2026`**. Enter the email (or just pick the Team).

| Role               | Name          | Email                      |
| ------------------ | ------------- | -------------------------- |
| Relationship Mgr   | Yara Mansour  | `yara.mansour@contact.eg`  |
| Credit             | Tarek Fouad   | `tarek.fouad@contact.eg`   |
| FRA Validation     | Nadia Saleh   | `nadia.saleh@contact.eg`   |
| Division Committee | Hany Greiss   | `committee@contact.eg`     |
| Finance            | Omar Khalil   | `omar.khalil@contact.eg`   |
| Administrator      | System Admin  | `admin@contact.eg`         |

### Clients — *Clients* tab
Shared demo OTP: **`202611`** (already pre-filled). Enter the mobile (or pick the company).

| Type     | Company               | Mobile               | Factoring model       |
| -------- | --------------------- | -------------------- | --------------------- |
| Buyer    | Carrefour Egypt       | `+20 100 118 2420`   | reverse (anchor)      |
| Buyer    | Pepsi Egypt           | `+20 122 203 8170`   | reverse (anchor)      |
| Supplier | BIM Stores            | `+20 100 771 2040`   | reverse               |
| Supplier | Awlad Ragab           | `+20 111 559 0170`   | normal · disclosed    |
| Supplier | Super Market El Hamd  | `+20 100 882 1400`   | normal · silent       |

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
