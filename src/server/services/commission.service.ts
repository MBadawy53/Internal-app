// Computes — but does not persist — the commission earned on a closed
// lead. The intent is to surface what the employee/ambassador would be
// paid given the lead's final loan amount and the product's current tier
// schedule. A persisted ledger comes later, after the loan-system API
// integration confirms the final amount.

import type { CommissionPersona, Role } from "@prisma/client";
import { commissionRepository } from "@/server/repositories/commission.repository";
import { resolveCommissionRecipient } from "@/lib/commission/recipient";
import { computeCommissionPiastres, findTier } from "@/lib/commission/calculate";

/**
 * Why a commission can't be computed for a CONTRACT-stage lead. Surfaced in
 * the UI so the closer understands what's missing rather than silently
 * hiding the card.
 */
export type CommissionUncomputableReason =
  | "NO_AMOUNT"
  | "NO_PRODUCT"
  | "NO_RECIPIENT"
  | "NO_SCHEDULE"
  | "NO_TIER";

export interface ComputedCommission {
  recipient: { userId: string; persona: CommissionPersona } | null;
  productId: string | null;
  amountPiastres: bigint;
  commissionPiastres: bigint;
  tier: {
    id: string;
    label: string | null;
    fromAmountPiastres: bigint;
    toAmountPiastres: bigint | null;
    ratePercentBps: number | null;
    flatPiastres: bigint | null;
  } | null;
  /** Set when commissionPiastres is 0n because something is missing. */
  reason: CommissionUncomputableReason | null;
}

export interface LeadCommissionInput {
  productId: string | null;
  finalLoanAmountPiastres: bigint | null;
  ownerEmployeeId: string | null;
  referredByEmployeeId: string | null;
  owner: { id: string; role: Role } | null;
  referredBy: { id: string; role: Role } | null;
}

export async function computeLeadCommission(
  lead: LeadCommissionInput,
): Promise<ComputedCommission | null> {
  if (!lead.finalLoanAmountPiastres || lead.finalLoanAmountPiastres <= 0n) {
    return null;
  }
  const amount = lead.finalLoanAmountPiastres;
  const recipient = resolveCommissionRecipient(lead);

  if (!lead.productId) {
    return {
      recipient,
      productId: null,
      amountPiastres: amount,
      commissionPiastres: 0n,
      tier: null,
      reason: "NO_PRODUCT",
    };
  }
  if (!recipient) {
    return {
      recipient: null,
      productId: lead.productId,
      amountPiastres: amount,
      commissionPiastres: 0n,
      tier: null,
      reason: "NO_RECIPIENT",
    };
  }

  const row = await commissionRepository.findForProduct(lead.productId, recipient.persona);
  if (!row || !row.isActive || row.tiers.length === 0) {
    return {
      recipient,
      productId: lead.productId,
      amountPiastres: amount,
      commissionPiastres: 0n,
      tier: null,
      reason: "NO_SCHEDULE",
    };
  }

  const tier = findTier(row.tiers, amount);
  if (!tier) {
    return {
      recipient,
      productId: lead.productId,
      amountPiastres: amount,
      commissionPiastres: 0n,
      tier: null,
      reason: "NO_TIER",
    };
  }

  return {
    recipient,
    productId: lead.productId,
    amountPiastres: amount,
    commissionPiastres: computeCommissionPiastres(tier, amount),
    tier,
    reason: null,
  };
}
