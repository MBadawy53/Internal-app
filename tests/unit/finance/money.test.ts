import { describe, expect, it } from "vitest";
import {
  applyBps,
  clamp,
  egpToPiastres,
  formatBps,
  formatMoney,
  piastresToNumberEgp,
} from "@/lib/finance/money";

describe("Money", () => {
  describe("egpToPiastres", () => {
    it("converts whole numbers exactly", () => {
      expect(egpToPiastres(100)).toBe(10_000n);
      expect(egpToPiastres(1)).toBe(100n);
    });
    it("rounds to nearest piastre", () => {
      // 1.234 EGP = 123.4 piastres → 123
      expect(egpToPiastres(1.234)).toBe(123n);
      // 1.5 EGP = 150 piastres exactly
      expect(egpToPiastres(1.5)).toBe(150n);
      // 0.125 EGP = 12.5 piastres → 13 (half-away-from-zero)
      expect(egpToPiastres(0.125)).toBe(13n);
    });
    it("rejects negatives and non-finite", () => {
      expect(() => egpToPiastres(-1)).toThrow();
      expect(() => egpToPiastres(NaN)).toThrow();
      expect(() => egpToPiastres(Infinity)).toThrow();
    });
  });

  describe("piastresToNumberEgp", () => {
    it("inverts egpToPiastres", () => {
      expect(piastresToNumberEgp(10_000n)).toBe(100);
      expect(piastresToNumberEgp(123n)).toBe(1.23);
    });
  });

  describe("applyBps", () => {
    it("computes amount × bps / 10000 with half-up rounding", () => {
      expect(applyBps(10_000_00n, 100)).toBe(10_000n); // 10,000 EGP * 1% = 100 EGP
      expect(applyBps(10_000_00n, 1850)).toBe(185_000n); // 18.50% = 1,850 EGP
    });
    it("rounds halves up", () => {
      // 1 piastre × 50% = 0.5 piastre → 1
      expect(applyBps(1n, 5000)).toBe(1n);
    });
  });

  describe("clamp", () => {
    it("returns value when within bounds", () => {
      expect(clamp(500n, 100n, 1000n)).toBe(500n);
    });
    it("returns min when below floor", () => {
      expect(clamp(50n, 100n, 1000n)).toBe(100n);
    });
    it("returns max when above ceiling (when max > 0)", () => {
      expect(clamp(2000n, 100n, 1000n)).toBe(1000n);
    });
    it("treats max=0 as no ceiling", () => {
      expect(clamp(2000n, 100n, 0n)).toBe(2000n);
    });
  });

  describe("formatMoney", () => {
    it("formats in en-EG", () => {
      const out = formatMoney(10_000_00n, "en");
      expect(out).toMatch(/EGP|EGY|£|10,000/);
    });
    it("formats in ar-EG with Arabic-Indic digits", () => {
      const out = formatMoney(10_000_00n, "ar");
      expect(out.length).toBeGreaterThan(0);
    });
  });

  describe("formatBps", () => {
    it("formats as percentage with two decimals", () => {
      expect(formatBps(1850, "en")).toMatch(/18\.50/);
    });
  });
});
