"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/permissions";
import { requireActor } from "@/lib/auth/session";
import { logger } from "@/lib/logger";
import { quoteRepository } from "@/server/repositories/quote.repository";
import { productRepository } from "@/server/repositories/product.repository";
import { calculate, type CalculatorProductConfig } from "@/lib/finance/calculator";

const SaveQuoteSchema = z.object({
  productId: z.string().min(1),
  principalEgp: z.coerce.number().positive(),
  tenureMonths: z.coerce.number().int().positive(),
});

export type SaveQuoteResult =
  | { ok: true; quoteId: string }
  | { ok: false; error: "invalid_input" | "product_not_found" | "calc_failed"; message?: string };

export async function saveQuoteAction(input: {
  productId: string;
  principalEgp: number;
  tenureMonths: number;
}): Promise<SaveQuoteResult> {
  const actor = await requireActor();
  requirePermission(actor, "create", "quote");

  const parsed = SaveQuoteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid_input" };

  const product = await productRepository.findById(parsed.data.productId);
  if (!product || !product.isActive) return { ok: false, error: "product_not_found" };

  const config: CalculatorProductConfig = {
    amountMinPiastres: product.amountMinPiastres,
    amountMaxPiastres: product.amountMaxPiastres,
    tenureMinMonths: product.tenureMinMonths,
    tenureMaxMonths: product.tenureMaxMonths,
    flatInterestRateBps: product.flatInterestRateBps,
    decliningInterestRateBps: product.decliningInterestRateBps,
    adminFeeBps: product.adminFeeBps,
    adminFeeMinPiastres: product.adminFeeMinPiastres,
    adminFeeMaxPiastres: product.adminFeeMaxPiastres,
    insuranceRequired: product.insuranceRequired,
    earlySettlementFeeBps: product.earlySettlementFeeBps,
    latePaymentFeeBps: product.latePaymentFeeBps,
  };

  const principalPiastres = BigInt(Math.round(parsed.data.principalEgp * 100));

  let result;
  try {
    result = calculate({ principalPiastres, tenureMonths: parsed.data.tenureMonths }, config);
  } catch (err) {
    logger.warn({ err, input }, "quote.calc_failed");
    return { ok: false, error: "calc_failed", message: (err as Error).message };
  }

  // Snapshot includes the amortization table and the product config at quote time.
  // BigInt isn't JSON-serializable; convert to strings in the snapshot.
  const snapshotJson = JSON.parse(
    JSON.stringify(
      {
        productId: product.id,
        productName: { en: product.nameEn, ar: product.nameAr },
        productConfig: {
          flatInterestRateBps: product.flatInterestRateBps,
          decliningInterestRateBps: product.decliningInterestRateBps,
          adminFeeBps: product.adminFeeBps,
          adminFeeMinPiastres: product.adminFeeMinPiastres,
          adminFeeMaxPiastres: product.adminFeeMaxPiastres,
          insuranceRequired: product.insuranceRequired,
          earlySettlementFeeBps: product.earlySettlementFeeBps,
          latePaymentFeeBps: product.latePaymentFeeBps,
        },
        result: {
          principalPiastres: result.principalPiastres,
          tenureMonths: result.tenureMonths,
          monthlyInstallmentPiastres: result.monthlyInstallmentPiastres,
          totalInterestPiastres: result.totalInterestPiastres,
          totalPayablePiastres: result.totalPayablePiastres,
          adminFeePiastres: result.adminFeePiastres,
          amortization: result.amortization,
        },
      },
      (_key, value) => (typeof value === "bigint" ? value.toString() : value),
    ),
  );

  const quote = await quoteRepository.create({
    employee: { connect: { id: actor.id } },
    product: { connect: { id: product.id } },
    principalPiastres: result.principalPiastres,
    tenureMonths: result.tenureMonths,
    monthlyRateBps: product.flatInterestRateBps,
    monthlyInstallmentPiastres: result.monthlyInstallmentPiastres,
    totalPayablePiastres: result.totalPayablePiastres,
    totalInterestPiastres: result.totalInterestPiastres,
    insuranceIncluded: product.insuranceRequired,
    adminFeeIncluded: true,
    snapshotJson,
  });

  revalidatePath("/calculator");
  return { ok: true, quoteId: quote.id };
}
