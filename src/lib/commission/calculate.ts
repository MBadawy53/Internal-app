// Commission calculator — pure functions, no I/O.
//
// Given a product's commission tiers and a loan amount, decides which tier
// applies and computes the commission in piastres. A tier matches when
// `fromAmountPiastres <= amount < toAmountPiastres` (or toAmountPiastres
// is null, meaning unbounded). Within a tier, the commission is either
// `ratePercentBps` of the amount or `flatPiastres`, whichever the admin
// configured.

import { applyBps, type Piastres } from "@/lib/finance/money";

export interface CommissionTierLike {
  id: string;
  fromAmountPiastres: bigint;
  toAmountPiastres: bigint | null;
  ratePercentBps: number | null;
  flatPiastres: bigint | null;
  label: string | null;
}

export function findTier(
  tiers: ReadonlyArray<CommissionTierLike>,
  amountPiastres: bigint,
): CommissionTierLike | null {
  for (const t of tiers) {
    const aboveFloor = amountPiastres >= t.fromAmountPiastres;
    const belowCeiling = t.toAmountPiastres === null || amountPiastres < t.toAmountPiastres;
    if (aboveFloor && belowCeiling) return t;
  }
  return null;
}

export function computeCommissionPiastres(
  tier: CommissionTierLike,
  amountPiastres: bigint,
): Piastres {
  if (tier.ratePercentBps !== null) {
    return applyBps(amountPiastres, tier.ratePercentBps);
  }
  if (tier.flatPiastres !== null) {
    return tier.flatPiastres;
  }
  return 0n;
}
