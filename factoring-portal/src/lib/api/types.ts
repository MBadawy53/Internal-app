/**
 * Domain types for the Contact Digital Factoring Portal.
 *
 * These are the contracts the UI relies on. When wiring real back-end
 * services (see ./http.ts), map your API responses onto these shapes so the
 * presentation layer keeps working unchanged.
 */

/** Internal workflow stages (BRD §5). */
export type Stage =
  | 'draft'
  | 'submitted'
  | 'pendingbuyer'
  | 'fra'
  | 'division'
  | 'credit'
  | 'approved'
  | 'funded'
  | 'settled'
  | 'closed'
  | 'rejected';

export type FactoringType = 'reverse' | 'normal';
export type Initiator = 'buyer' | 'supplier';
export type Disclosure = 'disclosed' | 'silent';
export type SupplierModel = 'reverse' | 'normal';

export interface StageMeta {
  label: string;
  short: string;
  cls: string;
}

export interface Buyer {
  id: string;
  name: string;
  short: string;
  cr: string;
  email: string;
  phone: string;
  /** Brand colour for the white-labelled buyer experience (BRD ON-02/ON-06). */
  brand: string;
  limit: number;
  used: number;
  terms: string;
  buffer: string;
  rate: string;
  bank: string;
  suppliers: string[];
  status: 'active' | 'pending';
  concStatus: 'Normal' | 'Elevated' | 'High';
}

export interface Supplier {
  id: string;
  name: string;
  short: string;
  cr: string;
  email: string;
  phone: string;
  model: SupplierModel;
  buyers: string[];
  shareOfSales: string;
  since: string;
  limit: number;
  used: number;
  conc: string;
  terms: string;
  rate: string;
  bank: string;
  status: 'active' | 'pending';
  recourse?: boolean;
  disclosure?: Disclosure;
}

export interface AuditEntry {
  ts: string;
  actor: string;
  action: string;
  note: string;
}

export interface CaseDoc {
  n: string;
  t: string;
  sz: string;
}

/** A financing request / factored invoice as it moves through the pipeline. */
export interface FactoringCase {
  id: string;
  ref: string;
  type: FactoringType;
  initiator: Initiator;
  buyerId: string;
  supplierId: string;
  buyer: string;
  supplier: string;
  amount: number;
  currency: string;
  invoiceNo: string;
  issue: string;
  due: string;
  terms: string;
  stage: Stage;
  prevStage: Stage | null;
  rejFrom: Stage | null;
  recourse: boolean;
  disclosure: Disclosure | null;
  flagConc: boolean;
  ackEscrow: boolean;
  bulk: boolean;
  fraStatus: string;
  fraNotes: string;
  docs: CaseDoc[];
  notes: string;
  audit: AuditEntry[];
}

export interface NotificationItem {
  role: string;
  icon: string;
  bg: string;
  col: string;
  title: string;
  body: string;
  time: string;
  unread: boolean;
}

/** Mutation actor + context passed from the UI to the API layer. */
export interface ActorCtx {
  actor: string;
  note?: string;
}

export interface AdvanceResult {
  case: FactoringCase;
  from: Stage;
  to: Stage;
}

export interface CreateCaseInput {
  role: string;
  activeBuyerId?: string;
  activeSupplierId?: string;
}

export interface CreateCaseResult {
  case: FactoringCase;
  pendingBuyer: boolean;
}
