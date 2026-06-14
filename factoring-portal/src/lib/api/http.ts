/**
 * Real back-end adapter — THE INTEGRATION SEAM.
 *
 * This is where Contact's internal APIs get wired in. The portal currently
 * runs on `mockApi` (see ./mock.ts). To go live:
 *   1. Implement each method below against your internal endpoints.
 *   2. In ./index.ts switch `export const api` from `mockApi` to `httpApi`.
 *   3. Delete ./store.ts (mock seed) once nothing references it.
 *
 * Configure the base URL via NEXT_PUBLIC_API_BASE_URL (see .env.example).
 */
import type {
  ActorCtx,
  AdvanceResult,
  Buyer,
  CreateCaseInput,
  CreateCaseResult,
  FactoringCase,
  NotificationItem,
  Supplier,
} from './types';

/**
 * The contract the UI depends on. The mock implementation is synchronous for
 * convenience; the real client is async. When you swap implementations, also
 * update the UI call sites in src/lib/portal/engine.js (search for "🔌 SWAP")
 * to `await` these methods.
 */
export interface FactoringApi {
  listBuyers(): Promise<Buyer[]>;
  getBuyer(id: string): Promise<Buyer | undefined>;
  listSuppliers(): Promise<Supplier[]>;
  getSupplier(id: string): Promise<Supplier | undefined>;
  listCases(): Promise<FactoringCase[]>;
  getCase(id: string): Promise<FactoringCase | undefined>;
  listNotifications(role: string): Promise<NotificationItem[]>;

  advanceCase(id: string, ctx: ActorCtx): Promise<AdvanceResult | null>;
  rejectCase(id: string, ctx: ActorCtx & { reason: string }): Promise<FactoringCase | null>;
  acknowledgeEscrow(id: string, ctx: ActorCtx): Promise<FactoringCase | null>;
  settleCase(id: string, ctx: ActorCtx): Promise<FactoringCase | null>;
  addDocument(id: string, ctx: ActorCtx & { type: string }): Promise<FactoringCase | null>;
  createCase(input: CreateCaseInput): Promise<CreateCaseResult | null>;
}

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) throw new Error(`Factoring API ${res.status}: ${path}`);
  return (await res.json()) as T;
}

/**
 * Skeleton HTTP client. Endpoints are illustrative — adjust paths/payloads to
 * match Contact's internal API gateway.
 */
export const httpApi: FactoringApi = {
  listBuyers: () => request('/buyers'),
  getBuyer: (id) => request(`/buyers/${id}`),
  listSuppliers: () => request('/suppliers'),
  getSupplier: (id) => request(`/suppliers/${id}`),
  listCases: () => request('/requests'),
  getCase: (id) => request(`/requests/${id}`),
  listNotifications: (role) => request(`/notifications?role=${encodeURIComponent(role)}`),

  advanceCase: (id, ctx) => request(`/requests/${id}/advance`, { method: 'POST', body: JSON.stringify(ctx) }),
  rejectCase: (id, ctx) => request(`/requests/${id}/reject`, { method: 'POST', body: JSON.stringify(ctx) }),
  acknowledgeEscrow: (id, ctx) => request(`/requests/${id}/escrow-ack`, { method: 'POST', body: JSON.stringify(ctx) }),
  settleCase: (id, ctx) => request(`/requests/${id}/settle`, { method: 'POST', body: JSON.stringify(ctx) }),
  addDocument: (id, ctx) => request(`/requests/${id}/documents`, { method: 'POST', body: JSON.stringify(ctx) }),
  createCase: (input) => request('/requests', { method: 'POST', body: JSON.stringify(input) }),
};
