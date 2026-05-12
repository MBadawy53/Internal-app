// Affordability math — pure functions, no I/O.
//
// Given a maximum monthly installment the customer can afford and a tenor in
// months, reverse the standard PMT formula to find the maximum loan principal
// at a given annual rate. Used by the calculator's affordability mode where
// the cap is "50% of monthly income".

import type { Piastres } from "./money";
import { MONTHS_PER_PERIOD, PERIODS_PER_YEAR, type InstallmentPeriod } from "./calculator";

export const DBR_CAP_BPS = 5000; // 50.00% (50 / 100 = 5000 bps)

/**
 * Maximum monthly installment given a monthly net income and DBR cap.
 * `incomePiastres × DBR_CAP_BPS / 10_000`, rounded down.
 */
export function maxMonthlyFromIncome(incomePiastres: Piastres): Piastres {
  return (incomePiastres * BigInt(DBR_CAP_BPS)) / 10_000n;
}

/**
 * Scale the customer's monthly DBR cap into the product's installment period.
 * Quarterly bundles 3 months' DBR capacity; annually bundles 12.
 */
export function maxPerPeriodFromMonthly(
  maxMonthlyPiastres: Piastres,
  period: InstallmentPeriod,
): Piastres {
  return maxMonthlyPiastres * BigInt(MONTHS_PER_PERIOD[period]);
}

/**
 * Reverse PMT — given the customer's affordable per-period installment, the
 * tenor (in months), the declining annual rate, and the product's installment
 * period, return the maximum loan principal that fits.
 *
 *   P = PMT × (1 − (1+r)^-n) / r
 *     where r = annualBps / 10_000 / periodsPerYear
 *           n = tenureMonths / monthsPerPeriod
 *
 * Zero-rate fallback: P = PMT × n.
 */
export function maxLoanFromInstallment(
  maxPerPeriodPiastres: Piastres,
  tenureMonths: number,
  annualBps: number,
  period: InstallmentPeriod = "MONTHLY",
): Piastres {
  if (maxPerPeriodPiastres <= 0n || tenureMonths <= 0) return 0n;
  const monthsPerPeriod = MONTHS_PER_PERIOD[period];
  if (tenureMonths % monthsPerPeriod !== 0) return 0n;
  const nPeriods = tenureMonths / monthsPerPeriod;
  const periodsPerYear = PERIODS_PER_YEAR[period];
  if (annualBps === 0) {
    return maxPerPeriodPiastres * BigInt(nPeriods);
  }
  const r = annualBps / 10_000 / periodsPerYear;
  const factor = Math.pow(1 + r, -nPeriods);
  const principal = (Number(maxPerPeriodPiastres) * (1 - factor)) / r;
  if (!Number.isFinite(principal) || principal <= 0) return 0n;
  return BigInt(Math.floor(principal));
}
