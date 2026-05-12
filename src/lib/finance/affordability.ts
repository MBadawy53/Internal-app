// Affordability math — pure functions, no I/O.
//
// Given a maximum monthly installment the customer can afford and a tenor in
// months, reverse the standard PMT formula to find the maximum loan principal
// at a given annual rate. Used by the calculator's affordability mode where
// the cap is "50% of monthly income".

import type { Piastres } from "./money";

export const DBR_CAP_BPS = 5000; // 50.00% (50 / 100 = 5000 bps)

/**
 * Maximum monthly installment given a monthly net income and DBR cap.
 * `incomePiastres × DBR_CAP_BPS / 10_000`, rounded down.
 */
export function maxMonthlyFromIncome(incomePiastres: Piastres): Piastres {
  return (incomePiastres * BigInt(DBR_CAP_BPS)) / 10_000n;
}

/**
 * Reverse PMT — given the customer's affordable monthly installment, tenor,
 * and the product's declining annual rate (in bps), return the maximum loan
 * principal that fits.
 *
 * Zero-rate fallback: P = PMT × n.
 *
 *   P = PMT × (1 − (1+r)^-n) / r,   r = annualBps / 10_000 / 12
 *
 * Done in floating point (rational quantity), rounded back to bigint piastres.
 */
export function maxLoanFromInstallment(
  maxMonthlyPiastres: Piastres,
  tenureMonths: number,
  annualBps: number,
): Piastres {
  if (maxMonthlyPiastres <= 0n || tenureMonths <= 0) return 0n;
  if (annualBps === 0) {
    return maxMonthlyPiastres * BigInt(tenureMonths);
  }
  const r = annualBps / 10_000 / 12;
  const factor = Math.pow(1 + r, -tenureMonths);
  const principal = (Number(maxMonthlyPiastres) * (1 - factor)) / r;
  if (!Number.isFinite(principal) || principal <= 0) return 0n;
  return BigInt(Math.floor(principal));
}
