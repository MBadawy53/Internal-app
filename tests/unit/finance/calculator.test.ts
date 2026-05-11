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
  amountMaxPiastres: 5_000_000_00n, // 5,000,000 EGP
  tenureMinMonths: 12,
  tenureMaxMonths: 60,
  flatInterestRateBps: 1200, // echoed only — no longer used in math
  decliningInterestRateBps: 2300, // 23% reducing-balance
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
    expect(computeAdminFee(1_000_000_00n, baseProduct)).toBe(5_000_00n);
  });

  it("clamps to floor when 1% × amount is below min", () => {
    expect(computeAdminFee(10_000_00n, baseProduct)).toBe(500_00n);
  });

  it("returns clamp(amount × pct) when within bounds", () => {
    expect(computeAdminFee(200_000_00n, baseProduct)).toBe(2_000_00n);
  });
});

describe("calculate (declining-balance amortization)", () => {
  // Reference table values: 600,000 EGP loan @ 26.50% declining over 12–60 months.
  const productMortgage: CalculatorProductConfig = {
    ...baseProduct,
    decliningInterestRateBps: 2650,
  };

  it.each([
    { months: 12, monthlyEgp: 57_464, totalInterestEgp: 89_570 },
    { months: 24, monthlyEgp: 32_476, totalInterestEgp: 179_430 },
    { months: 36, monthlyEgp: 24_334, totalInterestEgp: 276_041 },
    { months: 48, monthlyEgp: 20_400, totalInterestEgp: 379_177 },
    { months: 60, monthlyEgp: 18_142, totalInterestEgp: 488_539 },
  ])(
    "matches PMT table for 600k @ 26.50% over $months months (~$monthlyEgp/mo)",
    ({ months, monthlyEgp, totalInterestEgp }) => {
      const r = calculate(
        { principalPiastres: 600_000_00n, tenureMonths: months },
        productMortgage,
      );
      const monthly = Number(r.monthlyInstallmentPiastres) / 100;
      const totalInterest = Number(r.totalInterestPiastres) / 100;
      // ±50 EGP tolerance — covers per-row rounding + last-row reconciliation.
      expect(Math.abs(monthly - monthlyEgp)).toBeLessThan(50);
      expect(Math.abs(totalInterest - totalInterestEgp)).toBeLessThan(50);
    },
  );

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

  it("interest decreases and principal increases over time", () => {
    const result = calculate({ principalPiastres: 500_000_00n, tenureMonths: 24 }, baseProduct);
    const first = result.amortization[0]!;
    const mid = result.amortization[12]!;
    expect(mid.interestPiastres).toBeLessThan(first.interestPiastres);
    expect(mid.principalPiastres).toBeGreaterThan(first.principalPiastres);
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
    expect(result.adminFeePiastres).toBe(5_000_00n);
  });

  it("derives an equivalent flat rate from actual interest", () => {
    // 600k @ 26.50% over 12 months: ~89,570 EGP interest → 14.93% flat equivalent.
    const r = calculate(
      { principalPiastres: 600_000_00n, tenureMonths: 12 },
      { ...baseProduct, decliningInterestRateBps: 2650 },
    );
    expect(Math.abs(r.equivalentFlatRateBps - 1493)).toBeLessThan(10);
  });

  it("handles zero declining rate (interest-free)", () => {
    const zeroRate: CalculatorProductConfig = {
      ...baseProduct,
      decliningInterestRateBps: 0,
    };
    const result = calculate({ principalPiastres: 60_000_00n, tenureMonths: 12 }, zeroRate);
    expect(result.totalInterestPiastres).toBe(0n);
    expect(result.totalPayablePiastres).toBe(60_000_00n);
    expect(result.monthlyInstallmentPiastres).toBe(5_000_00n);
    expect(result.equivalentFlatRateBps).toBe(0);
  });
});
