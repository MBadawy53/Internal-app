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
  /**
   * Optional merchant subsidy. When provided, the customer pays a flat-rate
   * installment at this rate; the merchant absorbs the gap up to the bank's
   * declining-balance interest. Leave undefined for "no subsidy" (customer
   * pays the full PMT).
   */
  customerFlatRateBps?: number;
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

  // Subsidy (only set when CalculatorInput.customerFlatRateBps was provided)
  customerFlatRateBps: number | null;
  customerTotalInterestPiastres: Piastres | null;
  customerMonthlyInstallmentPiastres: Piastres | null;
  subsidyTotalPiastres: Piastres | null;

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
 *   interest = round(outstanding × annualBps / 120_000)
 *     where 120_000 = 10_000 (bps) × 12 (months)
 */
function periodInterest(outstanding: Piastres, annualBps: number): Piastres {
  if (annualBps === 0 || outstanding <= 0n) return 0n;
  const num = outstanding * BigInt(annualBps);
  const den = 120_000n;
  return (num + den / 2n) / den;
}

/**
 * Standard PMT for a declining-balance loan.
 *   PMT = P × r × (1+r)^n / ((1+r)^n − 1)
 * Done in floating point (PMT is inherently rational) and rounded back to bigint piastres.
 * Falls back to equal-principal split when the rate is zero.
 */
function computeMonthlyInstallment(
  principalPiastres: Piastres,
  tenureMonths: number,
  annualBps: number,
): Piastres {
  if (annualBps === 0) {
    const m = BigInt(tenureMonths);
    const base = principalPiastres / m;
    return principalPiastres % m === 0n ? base : base + 1n;
  }
  const r = annualBps / 10_000 / 12;
  const factor = Math.pow(1 + r, tenureMonths);
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

  const monthlyInstallmentPiastres = computeMonthlyInstallment(
    principalPiastres,
    tenureMonths,
    annualBps,
  );

  const amortization: AmortizationRow[] = [];
  let outstanding = principalPiastres;
  let totalInterestPiastres = 0n;

  for (let m = 1; m <= tenureMonths; m++) {
    const isLast = m === tenureMonths;
    const interest = periodInterest(outstanding, annualBps);

    let installment: Piastres;
    let principalPart: Piastres;

    if (isLast) {
      // Settle whatever principal remains; this row's installment may differ
      // by a few piastres from the constant PMT due to rounding.
      principalPart = outstanding;
      installment = principalPart + interest;
    } else {
      installment = monthlyInstallmentPiastres;
      principalPart = installment - interest;
      if (principalPart < 0n) {
        // Rate × balance exceeds the installment — only happens with
        // pathological inputs. Pay nothing on principal this period.
        principalPart = 0n;
      } else if (principalPart > outstanding) {
        principalPart = outstanding;
        installment = principalPart + interest;
      }
    }

    outstanding -= principalPart;
    totalInterestPiastres += interest;

    amortization.push({
      month: m,
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

  // --- Optional merchant subsidy --------------------------------------------
  // Customer pays at a flat rate; merchant covers the gap.
  //   customerInterest = round(principal × customerFlatBps × tenureMonths / 120_000)
  //   customerMonthly  = ceilDiv(principal + customerInterest, tenureMonths)
  //   subsidy          = max(0, decliningInterest − customerInterest)
  let customerFlatRateBps: number | null = null;
  let customerTotalInterestPiastres: Piastres | null = null;
  let customerMonthlyInstallmentPiastres: Piastres | null = null;
  let subsidyTotalPiastres: Piastres | null = null;
  if (input.customerFlatRateBps !== undefined) {
    customerFlatRateBps = input.customerFlatRateBps;
    const months = BigInt(tenureMonths);
    const num = principalPiastres * BigInt(customerFlatRateBps) * months;
    const den = 120_000n;
    customerTotalInterestPiastres = (num + den / 2n) / den;
    const customerTotalPayable = principalPiastres + customerTotalInterestPiastres;
    const baseMonthly = customerTotalPayable / months;
    customerMonthlyInstallmentPiastres =
      customerTotalPayable % months === 0n ? baseMonthly : baseMonthly + 1n;
    const gap = totalInterestPiastres - customerTotalInterestPiastres;
    subsidyTotalPiastres = gap > 0n ? gap : 0n;
  }

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
    customerFlatRateBps,
    customerTotalInterestPiastres,
    customerMonthlyInstallmentPiastres,
    subsidyTotalPiastres,
    amortization,
  };
}
