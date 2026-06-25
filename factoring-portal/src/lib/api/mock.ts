/**
 * Mock API — synchronous, in-memory implementation used while there is no
 * back end. The UI engine calls THIS object today.
 *
 * 🔌 INTEGRATION: each method below is a swap point. The production target is
 * the async `FactoringApi` contract implemented in ./http.ts. Switch the
 * `api` export in ./index.ts from `mockApi` to the real client when ready.
 */
import { STAGE, autoFlow, makeCase, mkAudit, nextStage } from './domain';
import { store } from './store';
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

const find = (id: string): FactoringCase | undefined => store.cases.find((c) => c.id === id);

export const mockApi = {
  // ---- Queries ----
  listBuyers(): Buyer[] {
    return store.buyers;
  },
  getBuyer(id: string): Buyer | undefined {
    return store.buyers.find((b) => b.id === id);
  },
  listSuppliers(): Supplier[] {
    return store.suppliers;
  },
  getSupplier(id: string): Supplier | undefined {
    return store.suppliers.find((s) => s.id === id);
  },
  listCases(): FactoringCase[] {
    return store.cases;
  },
  getCase(id: string): FactoringCase | undefined {
    return find(id);
  },
  listNotifications(role: string): NotificationItem[] {
    return store.notifications.filter((n) => n.role === role || n.role === 'all');
  },

  // ---- Mutations ----
  /** Advance a request to the next workflow stage, running automated stages. */
  advanceCase(id: string, ctx: ActorCtx): AdvanceResult | null {
    const c = find(id);
    if (!c) return null;
    const from = c.stage;
    const to = nextStage(c);
    if (!to) return null;
    c.prevStage = from;
    c.stage = to;
    if (to === 'fra') c.fraStatus = 'pending';
    if (from === 'fra') c.fraStatus = 'validated';
    c.audit.push(mkAudit(ctx.actor, 'Advanced to ' + STAGE[to].label, ctx.note));
    autoFlow(c);
    return { case: c, from, to };
  },

  /** Reject at the current review stage with a mandatory reason (BRD WF-05). */
  rejectCase(id: string, ctx: ActorCtx & { reason: string }): FactoringCase | null {
    const c = find(id);
    if (!c) return null;
    c.rejFrom = c.stage;
    c.stage = 'rejected';
    c.notes = ctx.reason;
    c.audit.push(mkAudit(ctx.actor, 'Rejected at ' + STAGE[c.rejFrom!].label, ctx.reason));
    return c;
  },

  /** Record the silent-factoring escrow acknowledgement (BRD §5.2). */
  acknowledgeEscrow(id: string, ctx: ActorCtx): FactoringCase | null {
    const c = find(id);
    if (!c) return null;
    c.ackEscrow = true;
    c.audit.push(mkAudit(ctx.actor, 'Escrow acknowledgement signed', 'Silent factoring — collection via escrow confirmed'));
    return c;
  },

  /** Settle at maturity with proof of payment (BRD ST-02). */
  settleCase(id: string, ctx: ActorCtx): FactoringCase | null {
    const c = find(id);
    if (!c) return null;
    c.prevStage = c.stage;
    c.stage = 'settled';
    c.docs.push({ n: 'Proof of payment.pdf', t: 'Settlement', sz: '104 KB' });
    c.audit.push(mkAudit(ctx.actor, 'Settled with bank', 'Proof of payment uploaded'));
    return c;
  },

  addDocument(id: string, ctx: ActorCtx & { type: string }): FactoringCase | null {
    const c = find(id);
    if (!c) return null;
    c.docs.push({ n: ctx.type + '.pdf', t: ctx.type, sz: 80 + Math.floor(Math.random() * 180) + ' KB' });
    c.audit.push(mkAudit(ctx.actor, 'Document uploaded', ctx.type));
    return c;
  },

  /** Create a new financing request from an uploaded invoice (BRD IN-01/IN-04). */
  createCase(input: CreateCaseInput): CreateCaseResult | null {
    let buyerId: string;
    let supplierId: string;
    let initiator: 'buyer' | 'supplier';
    if (input.role === 'buyer') {
      const b = (input.activeBuyerId && this.getBuyer(input.activeBuyerId)) || store.buyers[0];
      buyerId = b.id;
      supplierId = b.suppliers[0];
      initiator = 'buyer';
    } else if (input.role === 'supplier') {
      const s = (input.activeSupplierId && this.getSupplier(input.activeSupplierId)) || store.suppliers[0];
      supplierId = s.id;
      buyerId = s.buyers[0];
      initiator = 'supplier';
    } else {
      buyerId = store.buyers[0].id;
      supplierId = store.suppliers[0].id;
      initiator = 'buyer';
    }
    const b = this.getBuyer(buyerId);
    const s = this.getSupplier(supplierId);
    if (!s) return null;
    const isReverseSupplier = initiator === 'supplier' && s.model === 'reverse';
    const nc = makeCase({
      type: s.model,
      initiator,
      buyer: b,
      supplier: s,
      buyerId,
      supplierId,
      amount: 1000000 + Math.floor(Math.random() * 3000000),
      invoiceNo: 'INV-2026-0' + (490 + Math.floor(Math.random() * 99)),
      issue: '2026-06-11',
      due: '2026-08-10',
      stage: isReverseSupplier ? 'pendingbuyer' : 'submitted',
      extra: { recourse: s.model === 'normal', disclosure: s.disclosure },
    });
    store.cases.unshift(nc);
    if (!isReverseSupplier) autoFlow(nc);
    return { case: nc, pendingBuyer: isReverseSupplier };
  },
};

export type MockApi = typeof mockApi;
