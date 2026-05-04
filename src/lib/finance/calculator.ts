// Loan calculator — pure functions, no I/O.
// Egyptian flat-rate financing model.
//
// Conventions:
//   - All money is BigInt piastres (1 EGP = 100). No floats in math.
//   - Rates are basis points (1 bps = 0.01%; 1850 bps = 18.50%).
//   - Tenure is integer months.
//   - Admin enters BOTH a flat rate and a declining/reducing-balance rate. We do not
//     convert between them. The monthly payment is derived from the FLAT rate;
//     the declining rate is shown for transparency only.

import { applyBps, clamp, type Piastres } from "./money";

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

  // Rates (echoed)
  flatInterestRateBps: number;
  decliningInterestRateBps: number;

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
 * Egyptian flat-rate loan calculation.
 *
 * Total interest = principal × flatRate × years
 * Total payable  = principal + total interest
 * Monthly payment = total payable / tenure months
 *
 * Years are computed as `tenureMonths / 12` using integer-only math:
 *   totalInterest = principal * flatRateBps * tenureMonths / (10000 * 12)
 *
 * The amortization schedule shown for a flat-rate loan uses level interest
 * (totalInterest / months) and level principal (principal / months) per row,
 * with the last row absorbing rounding remainders so totals reconcile exactly.
 */
export function calculate(
  input: CalculatorInput,
  product: CalculatorProductConfig,
): CalculatorResult {
  validateInput(input, product);

  const { principalPiastres, tenureMonths } = input;
  const months = BigInt(tenureMonths);

  // Total interest in piastres, integer math, half-up rounding.
  // numerator = principal × flatRateBps × tenureMonths
  // denominator = 10_000 × 12 = 120_000
  const numerator = principalPiastres * BigInt(product.flatInterestRateBps) * months;
  const denominator = 120_000n;
  const totalInterestPiastres = (numerator + denominator / 2n) / denominator;

  const totalPayablePiastres = principalPiastres + totalInterestPiastres;

  // Monthly installment, with last-row reconciliation.
  const baseInstallment = totalPayablePiastres / months;
  const remainder = totalPayablePiastres - baseInstallment * months;

  const monthlyInstallmentPiastres = baseInstallment + (remainder > 0n ? 1n : 0n);

  // Amortization rows — flat schedule.
  const baseInterestPerMonth = totalInterestPiastres / months;
  const interestRemainder = totalInterestPiastres - baseInterestPerMonth * months;

  const basePrincipalPerMonth = principalPiastres / months;
  const principalRemainder = principalPiastres - basePrincipalPerMonth * months;

  const amortization: AmortizationRow[] = [];
  let outstanding = principalPiastres;

  for (let m = 1; m <= tenureMonths; m++) {
    const isLast = m === tenureMonths;

    const interest = baseInterestPerMonth + (isLast ? interestRemainder : 0n);
    const principal = basePrincipalPerMonth + (isLast ? principalRemainder : 0n);
    const installment = interest + principal;

    outstanding -= principal;

    amortization.push({
      month: m,
      installmentPiastres: installment,
      interestPiastres: interest,
      principalPiastres: principal,
      remainingPrincipalPiastres: outstanding < 0n ? 0n : outstanding,
    });
  }

  const adminFeePiastres = computeAdminFee(principalPiastres, product);

  return {
    principalPiastres,
    tenureMonths,
    flatInterestRateBps: product.flatInterestRateBps,
    decliningInterestRateBps: product.decliningInterestRateBps,
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
