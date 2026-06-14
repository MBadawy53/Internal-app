/**
 * Pure business logic for the factoring workflow (BRD §5).
 *
 * This is the deterministic core of the state machine. It is framework- and
 * transport-agnostic and is shared by both the mock implementation and any
 * real back-end adapter.
 */
import type {
  AuditEntry,
  Buyer,
  FactoringCase,
  FactoringType,
  Initiator,
  Stage,
  StageMeta,
  Supplier,
} from './types';

export const STAGE: Record<Stage, StageMeta> = {
  draft: { label: 'Draft', short: 'Draft', cls: 'draft' },
  submitted: { label: 'Submitted', short: 'Submitted', cls: 'submitted' },
  pendingbuyer: { label: 'Pending Buyer Validation', short: 'Buyer Validation', cls: 'pendingbuyer' },
  fra: { label: 'FRA Validation', short: 'FRA Validation', cls: 'fra' },
  division: { label: 'Division Committee', short: 'Division Cttee', cls: 'division' },
  credit: { label: 'Credit Review', short: 'Credit Review', cls: 'credit' },
  approved: { label: 'Approved', short: 'Approved', cls: 'approved' },
  funded: { label: 'Funded', short: 'Funded', cls: 'funded' },
  settled: { label: 'Settled', short: 'Settled', cls: 'settled' },
  closed: { label: 'Closed', short: 'Closed', cls: 'closed' },
  rejected: { label: 'Rejected', short: 'Rejected', cls: 'rejected' },
};

/**
 * Build the ordered stage chain for a request. Two stages are conditional:
 *  - Buyer Validation: only supplier-initiated reverse invoices (BRD §5.1).
 *  - Division Committee: only when supplier concentration is flagged (BRD §5.1).
 */
export function chainFor(c: Pick<FactoringCase, 'type' | 'initiator' | 'flagConc'>): Stage[] {
  const ch: Stage[] = ['draft', 'submitted'];
  if (c.type === 'reverse' && c.initiator === 'supplier') ch.push('pendingbuyer');
  ch.push('fra');
  if (c.flagConc) ch.push('division');
  ch.push('credit', 'approved', 'funded', 'settled', 'closed');
  return ch;
}

export function nextStage(c: FactoringCase): Stage | null {
  const ch = chainFor(c);
  const i = ch.indexOf(c.stage);
  return i >= 0 && i < ch.length - 1 ? ch[i + 1] : null;
}

export function nowStr(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10) + ' ' + d.toTimeString().slice(0, 5);
}

export function mkAudit(actor: string, action: string, note?: string): AuditEntry {
  return { ts: nowStr(), actor, action, note: note || '' };
}

export function transitionLabel(_from: Stage, to: Stage): string {
  const m: Partial<Record<Stage, string>> = {
    pendingbuyer: 'validated by buyer',
    fra: 'passed FRA validation',
    division: 'cleared committee allocation',
    credit: 'credit-approved',
    approved: 'approved',
    funded: 'funded via SWIFT',
    settled: 'settled',
    closed: 'closed',
    submitted: 'submitted',
  };
  return m[to] || 'moved to ' + STAGE[to].label;
}

/**
 * Automated, no-human-action stages. 'submitted' routes immediately and 'fra'
 * reflects the FRA e-invoice integration — a request never rests here (BRD §5.1).
 */
export function autoFlow(c: FactoringCase): void {
  const AUTO: Partial<Record<Stage, string>> = {
    submitted: 'Routed to FRA validation (automated)',
    fra: 'FRA e-invoice validation passed (automated integration)',
  };
  let guard = 0;
  while (AUTO[c.stage] && guard++ < 8) {
    const nx = nextStage(c);
    if (!nx) break;
    if (c.stage === 'fra') c.fraStatus = 'validated';
    const note = AUTO[c.stage]!;
    c.prevStage = c.stage;
    c.stage = nx;
    c.audit.push(mkAudit('System · FRA e-invoice', 'Auto-advanced to ' + STAGE[nx].label, note));
  }
}

let CASE_SEQ = 1042;

/** Factory for a new request record (mirrors the prototype's `c()` helper). */
export function makeCase(args: {
  type: FactoringType;
  initiator: Initiator;
  buyer?: Buyer;
  supplier?: Supplier;
  buyerId: string;
  supplierId: string;
  amount: number;
  invoiceNo: string;
  issue: string;
  due: string;
  stage: Stage;
  extra?: Partial<FactoringCase> & { rejFrom?: Stage };
}): FactoringCase {
  const extra = args.extra || {};
  const id = 'REQ-' + CASE_SEQ++;
  const disclosure = (extra.disclosure as FactoringCase['disclosure']) || null;
  return {
    id,
    ref: id,
    type: args.type,
    initiator: args.initiator,
    buyerId: args.buyerId,
    supplierId: args.supplierId,
    buyer: args.buyer ? args.buyer.name : args.buyerId,
    supplier: args.supplier ? args.supplier.name : args.supplierId,
    amount: args.amount,
    currency: 'EGP',
    invoiceNo: args.invoiceNo,
    issue: args.issue,
    due: args.due,
    terms: args.buyer ? args.buyer.terms : 'Net 60',
    stage: args.stage,
    prevStage: null,
    rejFrom: extra.rejFrom || null,
    recourse: args.type === 'normal' ? true : !!extra.recourse,
    disclosure,
    flagConc: !!extra.flagConc,
    ackEscrow: extra.ackEscrow !== undefined ? extra.ackEscrow : disclosure === 'silent' ? false : true,
    bulk: false,
    fraStatus:
      args.stage === 'fra'
        ? 'pending'
        : ['draft', 'submitted', 'pendingbuyer', 'rejected'].includes(args.stage)
          ? '—'
          : 'validated',
    fraNotes: '',
    docs: [
      { n: 'Commercial invoice.pdf', t: 'Invoice', sz: '214 KB' },
      { n: 'Delivery note.pdf', t: 'Proof of delivery', sz: '88 KB' },
    ],
    notes: '',
    audit: [
      mkAudit(args.initiator === 'buyer' ? 'Buyer' : 'Supplier', 'Request created', 'Invoice uploaded to portal'),
    ],
  };
}
