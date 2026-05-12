// Loan calculator — pure functions, no I/O.
// Declining-balance (reducing-balance) amortization model.
//
// Conventions:
//   - All money is BigInt piastres (1 EGP = 100). No floats outside the
//     PMT step (which is inherently fractional and rounded back to bigint).
//   - Rates are basis points (1 bps = 0.01%; 2650 bps = 26.50%).
//   - Tenure is integer months.
//   - Monthly installment is the standard PMT for the declining rate.
//     Each row's interest = outstanding × monthlyRate (rounded). Principal
//     = installment − interest. Last row reconciles by paying off whatever
//     principal remains.

import { applyBps, clamp, type Piastres } from "./money";

/** How often the customer pays. Drives the PMT formula and schedule rows. */
export type InstallmentPeriod = "MONTHLY" | "QUARTERLY" | "ANNUALLY";

export const PERIODS_PER_YEAR: Record<InstallmentPeriod, number> = {
  MONTHLY: 12,
  QUARTERLY: 4,
  ANNUALLY: 1,
};

export const MONTHS_PER_PERIOD: Record<InstallmentPeriod, number> = {
  MONTHLY: 1,
  QUARTERLY: 3,
  ANNUALLY: 12,
};

export interface CalculatorProductConfig {
  amountMinPiastres: Piastres;
  amountMaxPiastres: Piastres;
  tenureMinMonths: number;
  tenureMaxMonths: number;
  flatInterestRateBps: number;
  decliningInterestRateBps: number;
  adminFeeBps: number;
  adminFeeMinPiastres: Piastres;
  adminFeeMaxPiastres: Piastres;
  insuranceRequired: boolean;
  earlySettlementFeeBps: number;
  latePaymentFeeBps: number;
  installmentPeriod?: InstallmentPeriod;
}

export interface CalculatorInput {
  principalPiastres: Piastres;
  tenureMonths: number;
}

export interface AmortizationRow {
  month: number;
  installmentPiastres: Piastres;
  interestPiastres: Piastres;
  principalPiastres: Piastres;
  remainingPrincipalPiastres: Piastres;
}

export interface CalculatorResult {
  // Inputs (echoed for snapshot)
  principalPiastres: Piastres;
  tenureMonths: number;

  // Rates: admin's configured values (echoed) + derived equivalent flat.
  flatInterestRateBps: number;
  decliningInterestRateBps: number;
  /** Flat rate equivalent of the actual interest paid: totalInterest / principal / years. */
  equivalentFlatRateBps: number;

  // Computed line items
  monthlyInstallmentPiastres: Piastres;
  totalInterestPiastres: Piastres;
  totalPayablePiastres: Piastres;
  adminFeePiastres: Piastres;

  // Pass-through policy info
  insuranceRequired: boolean;
  earlySettlementFeeBps: number;
  latePaymentFeeBps: number;

  // Schedule
  amortization: AmortizationRow[];
}

export class CalculatorValidationError extends Error {
  constructor(
    public field: "principal" | "tenure",
    public reason: "below_min" | "above_max" | "non_integer" | "non_positive",
    message: string,
  ) {
    super(message);
    this.name = "CalculatorValidationError";
  }
}

/**
 * Validate user inputs against the product's configured bounds.
 * Throws {@link CalculatorValidationError} on failure.
 */
export function validateInput(input: CalculatorInput, product: CalculatorProductConfig): void {
  const { principalPiastres, tenureMonths } = input;

  if (principalPiastres <= 0n) {
    throw new CalculatorValidationError("principal", "non_positive", "Principal must be positive");
  }
  if (principalPiastres < product.amountMinPiastres) {
    throw new CalculatorValidationError(
      "principal",
      "below_min",
      `Principal is below minimum ${product.amountMinPiastres}`,
    );
  }
  if (principalPiastres > product.amountMaxPiastres) {
    throw new CalculatorValidationError(
      "principal",
      "above_max",
      `Principal is above maximum ${product.amountMaxPiastres}`,
    );
  }

  if (!Number.isInteger(tenureMonths)) {
    throw new CalculatorValidationError("tenure", "non_integer", "Tenure must be an integer");
  }
  if (tenureMonths <= 0) {
    throw new CalculatorValidationError("tenure", "non_positive", "Tenure must be positive");
  }
  if (tenureMonths < product.tenureMinMonths) {
    throw new CalculatorValidationError(
      "tenure",
      "below_min",
      `Tenure is below minimum ${product.tenureMinMonths}`,
    );
  }
  if (tenureMonths > product.tenureMaxMonths) {
    throw new CalculatorValidationError(
      "tenure",
      "above_max",
      `Tenure is above maximum ${product.tenureMaxMonths}`,
    );
  }
}

/**
 * Compute the admin fee using the standard EGY clamp formula:
 *   adminFee = clamp(amount × adminFeeBps / 10000, adminFeeMinPiastres, adminFeeMaxPiastres)
 */
export function computeAdminFee(
  principalPiastres: Piastres,
  product: Pick<
    CalculatorProductConfig,
    "adminFeeBps" | "adminFeeMinPiastres" | "adminFeeMaxPiastres"
  >,
): Piastres {
  const raw = applyBps(principalPiastres, product.adminFeeBps);
  return clamp(raw, product.adminFeeMinPiastres, product.adminFeeMaxPiastres);
}

/**
 * One period's interest on the outstanding balance, half-up rounded.
 *   interest = round(outstanding × annualBps / (10_000 × periodsPerYear))
 */
function periodInterest(
  outstanding: Piastres,
  annualBps: number,
  periodsPerYear: number,
): Piastres {
  if (annualBps === 0 || outstanding <= 0n) return 0n;
  const num = outstanding * BigInt(annualBps);
  const den = 10_000n * BigInt(periodsPerYear);
  return (num + den / 2n) / den;
}

/**
 * Standard PMT for a declining-balance loan, generalised over period length.
 *   PMT = P × r × (1+r)^n / ((1+r)^n − 1)
 *     where r = annualRate / periodsPerYear and n = total number of periods.
 * Falls back to equal-principal split when the rate is zero.
 */
function computePerPeriodInstallment(
  principalPiastres: Piastres,
  nPeriods: number,
  annualBps: number,
  periodsPerYear: number,
): Piastres {
  if (annualBps === 0) {
    const n = BigInt(nPeriods);
    const base = principalPiastres / n;
    return principalPiastres % n === 0n ? base : base + 1n;
  }
  const r = annualBps / 10_000 / periodsPerYear;
  const factor = Math.pow(1 + r, nPeriods);
  const pmt = (Number(principalPiastres) * r * factor) / (factor - 1);
  return BigInt(Math.round(pmt));
}

/**
 * Declining-balance loan calculation.
 *
 * Per-period interest is charged on the outstanding balance at
 * (decliningRate / 12). The constant monthly installment (PMT) covers that
 * period's interest plus a principal slice. Over time the interest portion
 * shrinks and the principal portion grows. The last row reconciles by
 * paying off whatever principal is still owed, so the schedule sums match
 * the totals exactly.
 *
 * The "flat rate" admin field is echoed and is also derived (equivalent
 * flat = totalInterest / principal / years) for transparency.
 */
export function calculate(
  input: CalculatorInput,
  product: CalculatorProductConfig,
): CalculatorResult {
  validateInput(input, product);

  const { principalPiastres, tenureMonths } = input;
  const annualBps = product.decliningInterestRateBps;
  const period: InstallmentPeriod = product.installmentPeriod ?? "MONTHLY";
  const periodsPerYear = PERIODS_PER_YEAR[period];
  const monthsPerPeriod = MONTHS_PER_PERIOD[period];

  // The tenor (in months) must be a whole number of periods. The UI converts
  // before calling us; this is a defensive guard.
  if (tenureMonths % monthsPerPeriod !== 0) {
    throw new CalculatorValidationError(
      "tenure",
      "non_integer",
      `Tenor must be a whole number of ${period.toLowerCase()} periods`,
    );
  }
  const nPeriods = tenureMonths / monthsPerPeriod;

  const monthlyInstallmentPiastres = computePerPeriodInstallment(
    principalPiastres,
    nPeriods,
    annualBps,
    periodsPerYear,
  );

  const amortization: AmortizationRow[] = [];
  let outstanding = principalPiastres;
  let totalInterestPiastres = 0n;

  for (let p = 1; p <= nPeriods; p++) {
    const isLast = p === nPeriods;
    const interest = periodInterest(outstanding, annualBps, periodsPerYear);

    let installment: Piastres;
    let principalPart: Piastres;

    if (isLast) {
      principalPart = outstanding;
      installment = principalPart + interest;
    } else {
      installment = monthlyInstallmentPiastres;
      principalPart = installment - interest;
      if (principalPart < 0n) {
        principalPart = 0n;
      } else if (principalPart > outstanding) {
        principalPart = outstanding;
        installment = principalPart + interest;
      }
    }

    outstanding -= principalPart;
    totalInterestPiastres += interest;

    amortization.push({
      // `month` here means "period index" (1 for first installment, etc.).
      // Kept under the existing key to avoid renaming the public schema.
      month: p,
      installmentPiastres: installment,
      interestPiastres: interest,
      principalPiastres: principalPart,
      remainingPrincipalPiastres: outstanding < 0n ? 0n : outstanding,
    });
  }

  const totalPayablePiastres = principalPiastres + totalInterestPiastres;

  // Equivalent flat rate (bps): totalInterest / principal / years × 10_000.
  // Years = tenureMonths / 12. Integer math, half-up rounded.
  // equivBps = round(totalInterest × 10_000 × 12 / (principal × tenureMonths))
  const equivalentFlatRateBps =
    principalPiastres === 0n || tenureMonths === 0
      ? 0
      : Number(
          (totalInterestPiastres * 120_000n + (principalPiastres * BigInt(tenureMonths)) / 2n) /
            (principalPiastres * BigInt(tenureMonths)),
        );

  const adminFeePiastres = computeAdminFee(principalPiastres, product);

  return {
    principalPiastres,
    tenureMonths,
    flatInterestRateBps: product.flatInterestRateBps,
    decliningInterestRateBps: product.decliningInterestRateBps,
    equivalentFlatRateBps,
    monthlyInstallmentPiastres,
    totalInterestPiastres,
    totalPayablePiastres,
    adminFeePiastres,
    insuranceRequired: product.insuranceRequired,
    earlySettlementFeeBps: product.earlySettlementFeeBps,
    latePaymentFeeBps: product.latePaymentFeeBps,
    amortization,
  };
}
