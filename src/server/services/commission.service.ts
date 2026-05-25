// Computes — but does not persist — the commission earned on a closed
// lead. The intent is to surface what the employee/ambassador would be
// paid given the lead's final loan amount and the product's current tier
// schedule. A persisted ledger comes later, after the loan-system API
// integration confirms the final amount.

import type { CommissionPersona, Role } from "@prisma/client";
import { commissionRepository } from "@/server/repositories/commission.repository";
import { resolveCommissionRecipient } from "@/lib/commission/recipient";
import { computeCommissionPiastres, findTier } from "@/lib/commission/calculate";

export interface ComputedCommission {
  recipient: { userId: string; persona: CommissionPersona };
  productId: string;
  amountPiastres: bigint;
  commissionPiastres: bigint;
  /** Null when no commission tier matches the amount. */
  tier: {
    id: string;
    label: string | null;
    fromAmountPiastres: bigint;
    toAmountPiastres: bigint | null;
    ratePercentBps: number | null;
    flatPiastres: bigint | null;
  } | null;
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
  if (!lead.productId) return null;
  if (!lead.finalLoanAmountPiastres || lead.finalLoanAmountPiastres <= 0n) return null;
  const recipient = resolveCommissionRecipient(lead);
  if (!recipient) return null;

  const row = await commissionRepository.findForProduct(lead.productId, recipient.persona);
  if (!row || !row.isActive || row.tiers.length === 0) {
    return {
      recipient,
      productId: lead.productId,
      amountPiastres: lead.finalLoanAmountPiastres,
      commissionPiastres: 0n,
      tier: null,
    };
  }

  const tier = findTier(row.tiers, lead.finalLoanAmountPiastres);
  if (!tier) {
    return {
      recipient,
      productId: lead.productId,
      amountPiastres: lead.finalLoanAmountPiastres,
      commissionPiastres: 0n,
      tier: null,
    };
  }

  return {
    recipient,
    productId: lead.productId,
    amountPiastres: lead.finalLoanAmountPiastres,
    commissionPiastres: computeCommissionPiastres(tier, lead.finalLoanAmountPiastres),
    tier,
  };
}
