/**
 * In-memory mock store — the single source of truth the UI reads from today.
 *
 * 🔌 INTEGRATION: this module exists only so the portal runs without a back end.
 * Replace the mock reads/writes in ./mock.ts with the real adapter in ./http.ts;
 * this seed data can then be deleted.
 */
import { makeCase } from './domain';
import type { Buyer, FactoringCase, NotificationItem, Supplier } from './types';

const buyers: Buyer[] = [
  { id: 'BUY-CRF', name: 'Carrefour Egypt', short: 'Carrefour', cr: 'CR-118420', email: 'finance@carrefour.eg', phone: '+20 100 118 2420', brand: '#1B4DA1', limit: 50000000, used: 32000000, terms: 'Net 60', buffer: '15 days', rate: '15.5%', bank: 'CIB · 1100-4421', suppliers: ['SUP-BIM', 'SUP-KHZ', 'SUP-ARG'], status: 'active', concStatus: 'Normal' },
  { id: 'BUY-PEP', name: 'Pepsi Egypt', short: 'Pepsi', cr: 'CR-203817', email: 'ap@pepsi.eg', phone: '+20 122 203 8170', brand: '#004B93', limit: 30000000, used: 29000000, terms: 'Net 45', buffer: '10 days', rate: '16.0%', bank: 'NBE · 8830-2210', suppliers: ['SUP-ARG', 'SUP-HMD'], status: 'active', concStatus: 'High' },
  { id: 'BUY-EDT', name: 'Edita Food', short: 'Edita', cr: 'CR-330091', email: 'treasury@edita.eg', phone: '+20 111 330 0910', brand: '#C8102E', limit: 40000000, used: 12400000, terms: 'Net 60', buffer: '15 days', rate: '15.0%', bank: 'QNB · 5521-0098', suppliers: ['SUP-KHZ'], status: 'active', concStatus: 'Normal' },
  { id: 'BUY-SAU', name: 'Saudi Markets', short: 'Saudi', cr: 'CR-559002', email: 'finance@saudimkt.eg', phone: '+20 100 559 0020', brand: '#2E7D32', limit: 25000000, used: 9000000, terms: 'Net 45', buffer: '12 days', rate: '15.8%', bank: 'AAIB · 9912-3380', suppliers: ['SUP-BIM'], status: 'active', concStatus: 'Normal' },
  { id: 'BUY-MEF', name: 'Mahmoud El Far', short: 'El Far', cr: 'CR-447090', email: 'ap@elfar.eg', phone: '+20 111 447 0900', brand: '#E8730C', limit: 20000000, used: 18500000, terms: 'Net 90', buffer: '20 days', rate: '14.8%', bank: 'Banque Misr · 3300-1120', suppliers: ['SUP-HMD'], status: 'pending', concStatus: 'Elevated' },
];

const suppliers: Supplier[] = [
  { id: 'SUP-BIM', name: 'BIM Stores', short: 'BIM', cr: 'CR-771204', email: 'ar@bim.eg', phone: '+20 100 771 2040', model: 'reverse', buyers: ['BUY-CRF', 'BUY-SAU'], shareOfSales: '34%', since: '2019', limit: 18000000, used: 11500000, conc: '35%', terms: 'Net 60', rate: '15.5%', bank: 'CIB · 2210-7781', status: 'active' },
  { id: 'SUP-KHZ', name: 'Kheir Zaman', short: 'Kheir Zaman', cr: 'CR-664823', email: 'finance@kheirzaman.eg', phone: '+20 122 664 8230', model: 'reverse', buyers: ['BUY-CRF', 'BUY-EDT'], shareOfSales: '21%', since: '2020', limit: 16000000, used: 7400000, conc: '25%', terms: 'Net 60', rate: '15.5%', bank: 'AAIB · 9912-3380', status: 'active' },
  { id: 'SUP-ARG', name: 'Awlad Ragab', short: 'Awlad Ragab', cr: 'CR-559017', email: 'collections@awladragab.eg', phone: '+20 111 559 0170', model: 'normal', buyers: ['BUY-CRF', 'BUY-PEP'], shareOfSales: '—', since: '2018', limit: 22000000, used: 13800000, conc: '40%', terms: 'Net 45', rate: '14.5%', bank: 'Banque Misr · 3300-1120', status: 'active', recourse: true, disclosure: 'disclosed' },
  { id: 'SUP-HMD', name: 'Super Market El Hamd', short: 'El Hamd', cr: 'CR-882140', email: 'ap@elhamd.eg', phone: '+20 100 882 1400', model: 'normal', buyers: ['BUY-PEP', 'BUY-MEF'], shareOfSales: '—', since: '2021', limit: 12000000, used: 6500000, conc: '45%', terms: 'Net 90', rate: '14.8%', bank: 'QNB · 8810-2099', status: 'active', recourse: true, disclosure: 'silent' },
];

const findBuyer = (id: string) => buyers.find((b) => b.id === id);
const findSupplier = (id: string) => suppliers.find((s) => s.id === id);

type Seed = Parameters<typeof makeCase>[0];
const seed = (
  type: Seed['type'],
  initiator: Seed['initiator'],
  buyerId: string,
  supplierId: string,
  amount: number,
  invoiceNo: string,
  issue: string,
  due: string,
  stage: Seed['stage'],
  extra?: Seed['extra'],
): FactoringCase =>
  makeCase({ type, initiator, buyer: findBuyer(buyerId), supplier: findSupplier(supplierId), buyerId, supplierId, amount, invoiceNo, issue, due, stage, extra });

const cases: FactoringCase[] = [
  seed('reverse', 'buyer', 'BUY-CRF', 'SUP-BIM', 4250000, 'INV-2026-0412', '2026-05-28', '2026-07-27', 'settled', {}),
  seed('reverse', 'buyer', 'BUY-CRF', 'SUP-KHZ', 1880000, 'INV-2026-0418', '2026-06-01', '2026-07-31', 'funded', {}),
  seed('reverse', 'supplier', 'BUY-CRF', 'SUP-BIM', 3120000, 'INV-2026-0431', '2026-06-05', '2026-08-04', 'pendingbuyer', {}),
  seed('reverse', 'supplier', 'BUY-EDT', 'SUP-KHZ', 2640000, 'INV-2026-0433', '2026-06-06', '2026-07-21', 'pendingbuyer', {}),
  seed('reverse', 'buyer', 'BUY-SAU', 'SUP-BIM', 960000, 'INV-2026-0440', '2026-06-07', '2026-07-22', 'fra', {}),
  seed('reverse', 'buyer', 'BUY-CRF', 'SUP-BIM', 5400000, 'INV-2026-0444', '2026-06-08', '2026-08-07', 'deviation', { flagConc: true }),
  seed('reverse', 'supplier', 'BUY-EDT', 'SUP-KHZ', 1450000, 'INV-2026-0447', '2026-06-08', '2026-07-23', 'credit', {}),
  seed('reverse', 'buyer', 'BUY-CRF', 'SUP-KHZ', 2210000, 'INV-2026-0451', '2026-06-09', '2026-08-08', 'approved', {}),
  seed('reverse', 'buyer', 'BUY-SAU', 'SUP-BIM', 1130000, 'INV-2026-0455', '2026-06-09', '2026-07-24', 'submitted', {}),
  seed('reverse', 'supplier', 'BUY-CRF', 'SUP-BIM', 780000, 'INV-2026-0460', '2026-06-10', '2026-08-09', 'rejected', { rejFrom: 'fra' }),
  seed('reverse', 'buyer', 'BUY-CRF', 'SUP-KHZ', 1600000, 'INV-2026-0462', '2026-06-10', '2026-08-09', 'draft', {}),
  // Normal / recourse
  seed('normal', 'supplier', 'BUY-CRF', 'SUP-ARG', 6800000, 'INV-2026-0466', '2026-06-04', '2026-08-03', 'funded', { recourse: true, disclosure: 'disclosed' }),
  seed('normal', 'supplier', 'BUY-PEP', 'SUP-ARG', 3300000, 'INV-2026-0470', '2026-06-07', '2026-08-06', 'credit', { recourse: true, disclosure: 'disclosed' }),
  seed('normal', 'supplier', 'BUY-PEP', 'SUP-HMD', 2900000, 'INV-2026-0473', '2026-06-08', '2026-09-06', 'deviation', { recourse: true, disclosure: 'silent', flagConc: true }),
  seed('normal', 'supplier', 'BUY-MEF', 'SUP-HMD', 1750000, 'INV-2026-0477', '2026-06-09', '2026-09-08', 'fra', { recourse: true, disclosure: 'silent' }),
  seed('normal', 'supplier', 'BUY-CRF', 'SUP-ARG', 4100000, 'INV-2026-0480', '2026-06-10', '2026-08-09', 'approved', { recourse: true, disclosure: 'disclosed', ackEscrow: false }),
  seed('normal', 'supplier', 'BUY-PEP', 'SUP-HMD', 2050000, 'INV-2026-0483', '2026-06-10', '2026-08-09', 'settled', { recourse: true, disclosure: 'silent' }),
  // Silent factoring — escrow collection, buyer NOT notified, acknowledgement pending
  seed('normal', 'supplier', 'BUY-MEF', 'SUP-HMD', 2400000, 'INV-2026-0486', '2026-06-10', '2026-09-08', 'funded', { recourse: true, disclosure: 'silent', ackEscrow: false }),
  seed('normal', 'supplier', 'BUY-PEP', 'SUP-HMD', 1850000, 'INV-2026-0489', '2026-06-11', '2026-09-09', 'approved', { recourse: true, disclosure: 'silent', ackEscrow: false }),
];

const notifications: NotificationItem[] = [
  { role: 'buyer', icon: '⏳', bg: '#FCEDE2', col: '#C2410C', title: 'Supplier invoice awaiting your validation', body: 'BIM Stores submitted INV-2026-0431 (EGP 3,120,000).', time: '2h ago', unread: true },
  { role: 'supplier', icon: '🏦', bg: '#F4E8FC', col: '#9333EA', title: 'Instant SWIFT confirmation', body: 'INV-2026-0466 funded — advance disbursed to your account.', time: '5h ago', unread: true },
  { role: 'rm', icon: '⚖️', bg: '#F1E9FD', col: '#7C3AED', title: 'Concentration breach flagged', body: 'INV-2026-0444 routed to Deviation Committee for allocation.', time: '1d ago', unread: true },
  { role: 'rm', icon: '⚠️', bg: '#FEF1E0', col: '#B5651A', title: 'Pepsi near limit', body: 'Available headroom EGP 1,000,000 — review concentration.', time: '1d ago', unread: false },
  { role: 'fra', icon: '🛡️', bg: '#ECEBFB', col: '#4F46E5', title: '2 invoices pending FRA validation', body: 'New e-invoice checks required before processing.', time: '3h ago', unread: true },
  { role: 'finance', icon: '💳', bg: '#E6F3EB', col: '#15803D', title: 'Approved request ready to fund', body: 'INV-2026-0451 cleared all gates — ready for disbursement.', time: '4h ago', unread: true },
  { role: 'credit', icon: '📊', bg: '#E1F2F6', col: '#0E7490', title: 'Credit review requested', body: 'INV-2026-0447 passed concentration checks.', time: '6h ago', unread: false },
  { role: 'deviation', icon: '⚖️', bg: '#F1E9FD', col: '#7C3AED', title: 'Allocation review pending', body: '2 buyers flagged for supplier concentration division.', time: '7h ago', unread: true },
];

export const store = { buyers, suppliers, cases, notifications };
export type Store = typeof store;
