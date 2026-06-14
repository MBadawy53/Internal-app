# BRD coverage — Digital Factoring v0.2

How the portal implements the *Digital Factoring BRD v0.2*. "UI" = screen built
and interactive on mock data; "Logic" = enforced in `lib/api/domain.ts`.

## Roles (BRD §4)

All eight roles are modelled with tailored navigation, dashboards and a
permissions matrix: **Relationship Manager** (view-only on workflow), **Buyer**,
**Supplier**, **FRA Validation**, **Division Committee**, **Credit**,
**Finance/Execution**, **Administrator**. Switch via the top-bar "View as"
selector.

## Workflow stages (BRD §5)

The full 11-state pipeline is implemented in `domain.ts`
(`STAGE`, `chainFor`, `nextStage`, `autoFlow`):

`draft → submitted → [pendingbuyer] → fra → [division] → credit → approved → funded → settled → closed`, plus terminal `rejected`.

- **Conditional buyer validation** — only supplier-initiated *reverse* invoices (§5.1, IN-04). ✅ Logic
- **Conditional division committee** — only when concentration is flagged (§5.1, WF-04). ✅ Logic
- **Automated submitted/FRA routing** — passes straight through, audited as System (§5.1, WF-02). ✅ Logic
- **Client status mapping** — buyers/suppliers see the simplified track; ops see the full pipeline (§5.3). ✅ UI (`clientPipeline`)
- **Silent-factoring escrow gate** — acknowledgement required and audited (§5.2). ✅ UI + Logic

## Functional requirements

| Area (BRD)                         | Status | Where                                            |
| ---------------------------------- | ------ | ------------------------------------------------ |
| Onboarding & profiles (ON-01..06)  | UI     | Buyer/Supplier management, profile forms, branding (white-label buyer banner) |
| Invoice management (IN-01..06)     | UI     | Single upload, bulk upload, edit/delete by status, routing rules |
| Workflow & stages (WF-01..06)      | UI+Logic | Case file, pipeline, stage actions, RM view-only |
| Validation & checks (VL-01..04)    | UI     | FRA queue (automated monitor), limit/concentration/term display |
| Limit management (LM-01..04)       | UI     | Limits table + 5 detail views: Overview, Supplier Allocation, Concentration Analysis, Alerts, Approval History |
| Committee & credit (CM/CR)         | UI+Logic | Division & credit queues, allocation, approve/reject with audit |
| Funding/settlement/closure (ST)    | UI+Logic | Finance queue, instant-SWIFT funding, settlement w/ proof, closure, settlement tracking |
| Recourse (normal) factoring (RF)   | UI+Logic | Supplier-as-obligor, disclosed/silent, escrow acknowledgements |
| Audit trail                        | UI+Logic | Per-request timeline + global audit log; every mutation appends an entry |
| Bilingual EN/AR + RTL              | UI     | Language toggle; `dir=rtl` wired |

## End-to-end simulations (BRD §9)

Both worked examples are reproducible in the mock build:

1. **Reverse, supplier-initiated, concentration flagged, disclosed** — upload as
   Supplier (BIM → Carrefour), validate as Buyer, watch FRA auto-pass, route to
   Division Committee, Credit approve, Finance fund (SWIFT) → settle → close.
2. **Recourse (normal), silent, escrow collection** — upload as Supplier
   (El Hamd → El Far) silent, FRA auto-pass (committee skipped), Credit approve,
   sign escrow acknowledgement, fund → settle (escrow) → close.

## Not in scope here (per BRD §2.2 / future integration)

- Counterparty credit underwriting (handled in the normal lending channel).
- Real FRA e-invoice system, SWIFT/bank execution, GL postings — represented as
  integration points (`lib/api/http.ts`) to be wired to internal services.
- Production authentication (SSO/AD, OTP provider) — login is a UI mock today.
