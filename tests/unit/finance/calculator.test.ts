import { describe, expect, it } from "vitest";
import {
  CalculatorValidationError,
  type CalculatorProductConfig,
  calculate,
  computeAdminFee,
  validateInput,
} from "@/lib/finance/calculator";

const baseProduct: CalculatorProductConfig = {
  amountMinPiastres: 50_000_00n, // 50,000 EGP
  amountMaxPiastres: 2_000_000_00n, // 2,000,000 EGP
  tenureMinMonths: 12,
  tenureMaxMonths: 60,
  flatInterestRateBps: 1200, // 12% flat per year
  decliningInterestRateBps: 2300, // 23% reducing-balance equivalent (admin-set)
  adminFeeBps: 100, // 1%
  adminFeeMinPiastres: 500_00n, // 500 EGP floor
  adminFeeMaxPiastres: 5_000_00n, // 5,000 EGP ceiling
  insuranceRequired: false,
  earlySettlementFeeBps: 200, // 2%
  latePaymentFeeBps: 300, // 3%
};

describe("validateInput", () => {
  it("accepts inputs within bounds", () => {
    expect(() =>
      validateInput({ principalPiastres: 100_000_00n, tenureMonths: 24 }, baseProduct),
    ).not.toThrow();
  });

  it("rejects principal below min", () => {
    try {
      validateInput({ principalPiastres: 10_000_00n, tenureMonths: 24 }, baseProduct);
    } catch (err) {
      expect(err).toBeInstanceOf(CalculatorValidationError);
      const e = err as CalculatorValidationError;
      expect(e.field).toBe("principal");
      expect(e.reason).toBe("below_min");
    }
  });

  it("rejects tenure above max", () => {
    expect(() =>
      validateInput({ principalPiastres: 100_000_00n, tenureMonths: 120 }, baseProduct),
    ).toThrow(CalculatorValidationError);
  });

  it("rejects non-integer tenure", () => {
    expect(() =>
      validateInput({ principalPiastres: 100_000_00n, tenureMonths: 12.5 }, baseProduct),
    ).toThrow();
  });

  it("rejects non-positive principal", () => {
    expect(() => validateInput({ principalPiastres: 0n, tenureMonths: 24 }, baseProduct)).toThrow();
  });
});

describe("computeAdminFee", () => {
  it("clamps to ceiling when 1% × amount exceeds max", () => {
    // 1,000,000 × 1% = 10,000, ceiling is 5,000
    expect(computeAdminFee(1_000_000_00n, baseProduct)).toBe(5_000_00n);
  });

  it("clamps to floor when 1% × amount is below min", () => {
    // 10,000 × 1% = 100, floor is 500
    expect(computeAdminFee(10_000_00n, baseProduct)).toBe(500_00n);
  });

  it("returns clamp(amount × pct) when within bounds", () => {
    // 200,000 × 1% = 2,000 (within [500, 5000])
    expect(computeAdminFee(200_000_00n, baseProduct)).toBe(2_000_00n);
  });
});

describe("calculate (Egyptian flat-rate)", () => {
  it("computes a textbook 100k @ 12% flat over 24 months", () => {
    // Total interest = 100,000 × 0.12 × 2 years = 24,000
    // Total payable = 124,000
    // Monthly = 124,000 / 24 = 5,166.67 EGP/month
    const result = calculate({ principalPiastres: 100_000_00n, tenureMonths: 24 }, baseProduct);
    expect(result.totalInterestPiastres).toBe(24_000_00n);
    expect(result.totalPayablePiastres).toBe(124_000_00n);
    // 124,000.00 / 24 = 5166.6666... → installment ceiled by remainder
    expect(result.monthlyInstallmentPiastres).toBe(5_166_67n);
    expect(result.amortization).toHaveLength(24);
  });

  it("amortization sums reconcile with totals exactly", () => {
    const result = calculate({ principalPiastres: 250_000_00n, tenureMonths: 36 }, baseProduct);

    const sumInstallments = result.amortization.reduce(
      (acc, row) => acc + row.installmentPiastres,
      0n,
    );
    const sumInterest = result.amortization.reduce((acc, row) => acc + row.interestPiastres, 0n);
    const sumPrincipal = result.amortization.reduce((acc, row) => acc + row.principalPiastres, 0n);

    expect(sumInterest).toBe(result.totalInterestPiastres);
    expect(sumPrincipal).toBe(250_000_00n);
    expect(sumInstallments).toBe(result.totalPayablePiastres);
  });

  it("last amortization row leaves zero remaining principal", () => {
    const result = calculate({ principalPiastres: 175_000_00n, tenureMonths: 18 }, baseProduct);
    const last = result.amortization[result.amortization.length - 1]!;
    expect(last.remainingPrincipalPiastres).toBe(0n);
  });

  it("propagates admin fee, both rates, insurance flag, and policy bps", () => {
    const productInsuranceRequired: CalculatorProductConfig = {
      ...baseProduct,
      insuranceRequired: true,
    };
    const result = calculate(
      { principalPiastres: 500_000_00n, tenureMonths: 36 },
      productInsuranceRequired,
    );
    expect(result.flatInterestRateBps).toBe(1200);
    expect(result.decliningInterestRateBps).toBe(2300);
    expect(result.insuranceRequired).toBe(true);
    expect(result.earlySettlementFeeBps).toBe(200);
    expect(result.latePaymentFeeBps).toBe(300);
    // 500,000 × 1% = 5,000 (at ceiling)
    expect(result.adminFeePiastres).toBe(5_000_00n);
  });

  it("handles zero flat rate (interest-free)", () => {
    const zeroRate: CalculatorProductConfig = {
      ...baseProduct,
      flatInterestRateBps: 0,
    };
    const result = calculate({ principalPiastres: 60_000_00n, tenureMonths: 12 }, zeroRate);
    expect(result.totalInterestPiastres).toBe(0n);
    expect(result.totalPayablePiastres).toBe(60_000_00n);
    expect(result.monthlyInstallmentPiastres).toBe(5_000_00n);
  });
});
