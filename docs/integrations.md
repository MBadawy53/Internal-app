# Integrations

All external systems sit behind typed adapter interfaces in `src/lib/integrations/*`. Phase 1 ships nothing under those folders yet — the **stub adapters land in Phase 7**, and the real adapters drop in once vendor specs are received.

## Currently stubbed

| System       | Folder                             | Phase to implement stub | Status  |
| ------------ | ---------------------------------- | ----------------------- | ------- |
| Internal CRM | `src/lib/integrations/crm`         | Phase 7                 | Not yet |
| Core Banking | `src/lib/integrations/corebanking` | Phase 7                 | Not yet |
| SMS          | `src/lib/integrations/sms`         | Phase 5                 | Not yet |
| WhatsApp     | `src/lib/integrations/whatsapp`    | Phase 5                 | Not yet |
| Email        | `src/lib/integrations/email`       | Phase 5                 | Not yet |

## What we need from you when CRM specs arrive

For the internal CRM, please provide:

1. **Base URL** (production + staging).
2. **Authentication method** (Bearer token / OAuth2 client-credentials / mTLS / API key + header name).
3. **Lead schema** — the exact JSON shape your CRM expects on create. Map our fields:
   - `customerName`, `customerPhone`, `customerEmail` (decrypted), `nationalId` (decrypted), `source`, `productId`, `businessLineSlug`, `referredByEmployeeReferralCode`, `currentStatus`, `consentGivenAt`.
4. **Status taxonomy mapping** — your CRM's stage codes vs. our `LeadStatus` enum. We will ship a translation table.
5. **Webhook for status updates** — endpoint URL + signature header + secret rotation policy.
6. **Rate limits** — RPS, daily caps, retry/backoff guidance.
7. **Sandbox credentials** for development.

## What we need from you when Core Banking specs arrive

1. **Base URL** + auth (likely mTLS — provide certificate/CSR process).
2. **Endpoints we'll need:**
   - `GET /customer?nationalId=...` — fetch customer by national ID
   - `GET /loan/{loanId}/status` — current loan status
   - `POST /loan/application` — submit application created from a lead
3. **Field mappings** (request + response).
4. **Test environment credentials.**

## How adapters are wired

- **Interface** in `src/lib/integrations/<system>/types.ts` describes operations and request/response types.
- **Stub adapter** in `src/lib/integrations/<system>/stub.adapter.ts` logs calls and returns realistic mocked data.
- **Real adapter** in `src/lib/integrations/<system>/<vendor>.adapter.ts` is selected by env var (`CRM_PROVIDER`, `CORE_BANKING_PROVIDER`, etc.).
- **Admin config screen** (Phase 7) lets ADMINs supply credentials, encrypted at rest in `IntegrationConfig.valueEncJson`.
- **Two-way CRM sync** runs via `LeadSyncJob` rows — push on lead create/update, pull on schedule + manual trigger.

Until real specs arrive, the rest of the application is fully developable against the stubs.
