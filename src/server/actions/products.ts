"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Company, Role } from "@prisma/client";
import { requirePermission } from "@/lib/auth/permissions";
import { requireActor } from "@/lib/auth/session";
import { logger } from "@/lib/logger";
import type { Prisma } from "@prisma/client";
import { productRepository } from "@/server/repositories/product.repository";
import { attributeRepository } from "@/server/repositories/attribute.repository";
import { coerceAttributeValue, type AttributeOptionsJson } from "@/lib/catalog/attribute-values";
import { prisma } from "@/lib/prisma";
import { smartDelete, type SmartDeleteResult } from "@/server/lib/smart-delete";

const ProductInputSchema = z
  .object({
    businessLineId: z.string().min(1),
    categoryId: z.string().min(1),
    company: z
      .union([z.nativeEnum(Company), z.literal("")])
      .optional()
      .transform((v) => (v === "" || v === undefined ? null : v)),
    nameEn: z.string().min(1).max(160),
    nameAr: z.string().min(1).max(160),
    shortDescEn: z.string().min(1).max(500),
    shortDescAr: z.string().min(1).max(500),
    longDescEn: z.string().min(1).max(5000),
    longDescAr: z.string().min(1).max(5000),
    eligibilityEn: z.string().max(2000).optional().nullable(),
    eligibilityAr: z.string().max(2000).optional().nullable(),
    documentsEn: z.array(z.string().min(1).max(200)).default([]),
    documentsAr: z.array(z.string().min(1).max(200)).default([]),

    amountMinEgp: z.coerce.number().nonnegative(),
    amountMaxEgp: z.coerce.number().nonnegative(),
    tenureMinMonths: z.coerce.number().int().positive(),
    tenureMaxMonths: z.coerce.number().int().positive(),
    installmentPeriod: z.enum(["MONTHLY", "QUARTERLY", "ANNUALLY"]).default("MONTHLY"),

    flatInterestRateBps: z.coerce.number().int().min(0).max(100_000),
    decliningInterestRateBps: z.coerce.number().int().min(0).max(100_000),

    adminFeeBps: z.coerce.number().int().min(0).max(10_000),
    adminFeeMinEgp: z.coerce.number().nonnegative(),
    adminFeeMaxEgp: z.coerce.number().nonnegative(),

    insuranceRequired: z.coerce.boolean().default(false),

    minDownPaymentBps: z.coerce.number().int().min(0).max(10_000),

    earlySettlementFeeBps: z.coerce.number().int().min(0).max(10_000),
    latePaymentFeeBps: z.coerce.number().int().min(0).max(10_000),

    heroImageUrl: z.string().max(500).optional().nullable(),
    isFeatured: z.coerce.boolean().default(false),
    isActive: z.coerce.boolean().default(true),

    attributeIds: z.array(z.string()).default([]),
    attributeValues: z.array(z.string()).default([]),
  })
  .refine((d) => d.amountMinEgp <= d.amountMaxEgp, {
    path: ["amountMaxEgp"],
    message: "Maximum amount must be ≥ minimum",
  })
  .refine((d) => d.tenureMinMonths <= d.tenureMaxMonths, {
    path: ["tenureMaxMonths"],
    message: "Maximum tenure must be ≥ minimum",
  })
  .refine((d) => d.adminFeeMinEgp <= d.adminFeeMaxEgp, {
    path: ["adminFeeMaxEgp"],
    message: "Maximum admin fee must be ≥ minimum",
  });

export type ProductActionState =
  | { ok: true; id: string }
  | { ok: false; fieldErrors?: Record<string, string[]>; message?: string };

function fromFormData(fd: FormData) {
  const documentsEn = fd
    .getAll("documentsEn")
    .map((v) => v.toString())
    .filter(Boolean);
  const documentsAr = fd
    .getAll("documentsAr")
    .map((v) => v.toString())
    .filter(Boolean);

  // Per-product attribute values — parallel arrays from the form.
  const attributeIds = fd.getAll("attributeId").map((v) => v.toString());
  const attributeValues = fd.getAll("attributeValue").map((v) => v.toString());

  return {
    attributeIds,
    attributeValues,
    businessLineId: fd.get("businessLineId")?.toString() ?? "",
    categoryId: fd.get("categoryId")?.toString() ?? "",
    company: fd.get("company")?.toString() ?? "",
    nameEn: fd.get("nameEn")?.toString() ?? "",
    nameAr: fd.get("nameAr")?.toString() ?? "",
    shortDescEn: fd.get("shortDescEn")?.toString() ?? "",
    shortDescAr: fd.get("shortDescAr")?.toString() ?? "",
    longDescEn: fd.get("longDescEn")?.toString() ?? "",
    longDescAr: fd.get("longDescAr")?.toString() ?? "",
    eligibilityEn: fd.get("eligibilityEn")?.toString() || "" || null,
    eligibilityAr: fd.get("eligibilityAr")?.toString() || "" || null,
    documentsEn,
    documentsAr,
    amountMinEgp: fd.get("amountMinEgp")?.toString() ?? "0",
    amountMaxEgp: fd.get("amountMaxEgp")?.toString() ?? "0",
    tenureMinMonths: fd.get("tenureMinMonths")?.toString() ?? "1",
    tenureMaxMonths: fd.get("tenureMaxMonths")?.toString() ?? "1",
    installmentPeriod: fd.get("installmentPeriod")?.toString() ?? "MONTHLY",
    flatInterestRateBps: fd.get("flatInterestRateBps")?.toString() ?? "0",
    decliningInterestRateBps: fd.get("decliningInterestRateBps")?.toString() ?? "0",
    adminFeeBps: fd.get("adminFeeBps")?.toString() ?? "0",
    adminFeeMinEgp: fd.get("adminFeeMinEgp")?.toString() ?? "0",
    adminFeeMaxEgp: fd.get("adminFeeMaxEgp")?.toString() ?? "0",
    insuranceRequired:
      fd.get("insuranceRequired") === "on" || fd.get("insuranceRequired") === "true",
    minDownPaymentBps: fd.get("minDownPaymentBps")?.toString() ?? "0",
    earlySettlementFeeBps: fd.get("earlySettlementFeeBps")?.toString() ?? "0",
    latePaymentFeeBps: fd.get("latePaymentFeeBps")?.toString() ?? "0",
    heroImageUrl: fd.get("heroImageUrl")?.toString() || "" || null,
    isFeatured: fd.get("isFeatured") === "on" || fd.get("isFeatured") === "true",
    isActive: fd.get("isActive") === "on" || fd.get("isActive") === "true",
  };
}

function toBigIntPiastres(egp: number): bigint {
  return BigInt(Math.round(egp * 100));
}

export async function createProductAction(
  _prev: ProductActionState | null,
  formData: FormData,
): Promise<ProductActionState> {
  const actor = await requireActor();
  requirePermission(actor, "create", "product");

  const parsed = ProductInputSchema.safeParse(fromFormData(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;

  try {
    const created = await productRepository.create({
      company: d.company,
      nameEn: d.nameEn,
      nameAr: d.nameAr,
      shortDescEn: d.shortDescEn,
      shortDescAr: d.shortDescAr,
      longDescEn: d.longDescEn,
      longDescAr: d.longDescAr,
      eligibilityEn: d.eligibilityEn,
      eligibilityAr: d.eligibilityAr,
      documentsEn: d.documentsEn,
      documentsAr: d.documentsAr,
      amountMinPiastres: toBigIntPiastres(d.amountMinEgp),
      amountMaxPiastres: toBigIntPiastres(d.amountMaxEgp),
      tenureMinMonths: d.tenureMinMonths,
      tenureMaxMonths: d.tenureMaxMonths,
      installmentPeriod: d.installmentPeriod,
      flatInterestRateBps: d.flatInterestRateBps,
      decliningInterestRateBps: d.decliningInterestRateBps,
      adminFeeBps: d.adminFeeBps,
      adminFeeMinPiastres: toBigIntPiastres(d.adminFeeMinEgp),
      adminFeeMaxPiastres: toBigIntPiastres(d.adminFeeMaxEgp),
      insuranceRequired: d.insuranceRequired,
      minDownPaymentBps: d.minDownPaymentBps,
      earlySettlementFeeBps: d.earlySettlementFeeBps,
      latePaymentFeeBps: d.latePaymentFeeBps,
      heroImageUrl: d.heroImageUrl,
      isFeatured: d.isFeatured,
      isActive: d.isActive,
      businessLine: { connect: { id: d.businessLineId } },
      category: { connect: { id: d.categoryId } },
      createdBy: { connect: { id: actor.id } },
      updatedBy: { connect: { id: actor.id } },
    });
    const attrErrors = await persistProductAttributeValues(
      created.id,
      d.attributeIds,
      d.attributeValues,
    );
    if (attrErrors) return { ok: false, fieldErrors: attrErrors };
    revalidatePath("/admin/products");
    revalidatePath("/catalog");
    redirect("/admin/products");
    return { ok: true, id: created.id };
  } catch (err) {
    logger.error({ err }, "product.create_failed");
    throw err;
  }
}

export async function updateProductAction(
  id: string,
  _prev: ProductActionState | null,
  formData: FormData,
): Promise<ProductActionState> {
  const actor = await requireActor();
  requirePermission(actor, "update", "product");

  const parsed = ProductInputSchema.safeParse(fromFormData(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;

  try {
    await productRepository.update(id, {
      company: d.company,
      nameEn: d.nameEn,
      nameAr: d.nameAr,
      shortDescEn: d.shortDescEn,
      shortDescAr: d.shortDescAr,
      longDescEn: d.longDescEn,
      longDescAr: d.longDescAr,
      eligibilityEn: d.eligibilityEn,
      eligibilityAr: d.eligibilityAr,
      documentsEn: d.documentsEn,
      documentsAr: d.documentsAr,
      amountMinPiastres: toBigIntPiastres(d.amountMinEgp),
      amountMaxPiastres: toBigIntPiastres(d.amountMaxEgp),
      tenureMinMonths: d.tenureMinMonths,
      tenureMaxMonths: d.tenureMaxMonths,
      installmentPeriod: d.installmentPeriod,
      flatInterestRateBps: d.flatInterestRateBps,
      decliningInterestRateBps: d.decliningInterestRateBps,
      adminFeeBps: d.adminFeeBps,
      adminFeeMinPiastres: toBigIntPiastres(d.adminFeeMinEgp),
      adminFeeMaxPiastres: toBigIntPiastres(d.adminFeeMaxEgp),
      insuranceRequired: d.insuranceRequired,
      minDownPaymentBps: d.minDownPaymentBps,
      earlySettlementFeeBps: d.earlySettlementFeeBps,
      latePaymentFeeBps: d.latePaymentFeeBps,
      heroImageUrl: d.heroImageUrl,
      isFeatured: d.isFeatured,
      isActive: d.isActive,
      businessLine: { connect: { id: d.businessLineId } },
      category: { connect: { id: d.categoryId } },
      updatedBy: { connect: { id: actor.id } },
    });
    const attrErrors = await persistProductAttributeValues(id, d.attributeIds, d.attributeValues);
    if (attrErrors) return { ok: false, fieldErrors: attrErrors };
    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${id}`);
    revalidatePath("/catalog");
    revalidatePath(`/catalog/${id}`);
    redirect("/admin/products");
    return { ok: true, id };
  } catch (err) {
    logger.error({ err, id }, "product.update_failed");
    throw err;
  }
}

export async function deleteProductAction(id: string): Promise<void> {
  const actor = await requireActor();
  requirePermission(actor, "delete", "product");
  await productRepository.softDelete(id, actor.id);
  revalidatePath("/admin/products");
  revalidatePath("/catalog");
}

export async function deleteProductSafeAction(id: string): Promise<SmartDeleteResult> {
  const actor = await requireActor();
  if (actor.role !== Role.ADMIN) return { ok: false, message: "Forbidden" };
  if (!id) return { ok: false, message: "Missing id" };
  const result = await smartDelete({
    label: "product",
    id,
    hard: () => prisma.product.delete({ where: { id } }),
    soft: () => productRepository.softDelete(id, actor.id),
  });
  if (result.ok) {
    revalidatePath("/admin/products");
    revalidatePath("/catalog");
  }
  return result;
}

/**
 * Coerce raw attribute values against the master attribute registry, then
 * replace the product's full attribute-value set in one transaction.
 */
async function persistProductAttributeValues(
  productId: string,
  attributeIds: string[],
  rawValues: string[],
): Promise<Record<string, string[]> | null> {
  if (attributeIds.length === 0) {
    await productRepository.replaceAttributeValues(productId, []);
    return null;
  }
  const attributes = await Promise.all(attributeIds.map((id) => attributeRepository.findById(id)));
  const fieldErrors: Record<string, string[]> = {};
  const values: Array<{ attributeId: string; value: Prisma.InputJsonValue; sortOrder: number }> =
    [];
  attributes.forEach((attr, i) => {
    if (!attr || !attr.isActive) {
      fieldErrors[`attr_${i}`] = ["Unknown or inactive attribute"];
      return;
    }
    const opts = (attr.options as AttributeOptionsJson | null)?.options ?? [];
    try {
      const coerced = coerceAttributeValue(attr.type, rawValues[i] ?? "", opts);
      // Per-key bounds for insurance attributes: percentages in [0,100],
      // money amounts ≥ 0. Other numeric attributes are unbounded.
      if (typeof coerced === "number") {
        const isInsurancePercent =
          attr.key === "insurance.rate-under-threshold" ||
          attr.key === "insurance.rate-above-threshold" ||
          attr.key === "insurance.rate-after-5-years" ||
          attr.key === "insurance.rate-electric";
        const isInsuranceMoney =
          attr.key === "insurance.threshold-amount-egp" ||
          attr.key === "insurance.key-replacement-coverage-egp";
        if (isInsurancePercent && (coerced < 0 || coerced > 100)) {
          throw new Error("Must be between 0 and 100");
        }
        if (isInsuranceMoney && coerced < 0) {
          throw new Error("Must be greater than or equal to 0");
        }
      }
      values.push({
        attributeId: attr.id,
        value: coerced as Prisma.InputJsonValue,
        sortOrder: i,
      });
    } catch (err) {
      fieldErrors[`attr_${attr.key}`] = [(err as Error).message];
    }
  });
  if (Object.keys(fieldErrors).length > 0) return fieldErrors;
  await productRepository.replaceAttributeValues(productId, values);
  return null;
}
