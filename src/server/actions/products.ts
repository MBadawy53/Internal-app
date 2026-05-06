"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ProductType } from "@prisma/client";
import { requirePermission } from "@/lib/auth/permissions";
import { requireActor } from "@/lib/auth/session";
import { logger } from "@/lib/logger";
import { productRepository } from "@/server/repositories/product.repository";
import { productCategoryRepository } from "@/server/repositories/productCategory.repository";
import { makeAttributeConfig, type ProductAttributeKey } from "@/lib/catalog/attributes";

const ProductInputSchema = z
  .object({
    businessLineId: z.string().min(1),
    categoryId: z.string().min(1),
    type: z.nativeEnum(ProductType),
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

    flatInterestRateBps: z.coerce.number().int().min(0).max(100_000),
    decliningInterestRateBps: z.coerce.number().int().min(0).max(100_000),

    adminFeeBps: z.coerce.number().int().min(0).max(10_000),
    adminFeeMinEgp: z.coerce.number().nonnegative(),
    adminFeeMaxEgp: z.coerce.number().nonnegative(),

    insuranceRequired: z.coerce.boolean().default(false),

    earlySettlementFeeBps: z.coerce.number().int().min(0).max(10_000),
    latePaymentFeeBps: z.coerce.number().int().min(0).max(10_000),

    heroImageUrl: z.string().max(500).optional().nullable(),
    isFeatured: z.coerce.boolean().default(false),
    isActive: z.coerce.boolean().default(true),
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

  return {
    businessLineId: fd.get("businessLineId")?.toString() ?? "",
    categoryId: fd.get("categoryId")?.toString() ?? "",
    type: (fd.get("type")?.toString() ?? "") as ProductType,
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
    flatInterestRateBps: fd.get("flatInterestRateBps")?.toString() ?? "0",
    decliningInterestRateBps: fd.get("decliningInterestRateBps")?.toString() ?? "0",
    adminFeeBps: fd.get("adminFeeBps")?.toString() ?? "0",
    adminFeeMinEgp: fd.get("adminFeeMinEgp")?.toString() ?? "0",
    adminFeeMaxEgp: fd.get("adminFeeMaxEgp")?.toString() ?? "0",
    insuranceRequired:
      fd.get("insuranceRequired") === "on" || fd.get("insuranceRequired") === "true",
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

  const attrErrors = await validateAgainstCategory(d);
  if (attrErrors) return { ok: false, fieldErrors: attrErrors };

  try {
    const created = await productRepository.create({
      type: d.type,
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
      flatInterestRateBps: d.flatInterestRateBps,
      decliningInterestRateBps: d.decliningInterestRateBps,
      adminFeeBps: d.adminFeeBps,
      adminFeeMinPiastres: toBigIntPiastres(d.adminFeeMinEgp),
      adminFeeMaxPiastres: toBigIntPiastres(d.adminFeeMaxEgp),
      insuranceRequired: d.insuranceRequired,
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

  const attrErrors = await validateAgainstCategory(d);
  if (attrErrors) return { ok: false, fieldErrors: attrErrors };

  try {
    await productRepository.update(id, {
      type: d.type,
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
      flatInterestRateBps: d.flatInterestRateBps,
      decliningInterestRateBps: d.decliningInterestRateBps,
      adminFeeBps: d.adminFeeBps,
      adminFeeMinPiastres: toBigIntPiastres(d.adminFeeMinEgp),
      adminFeeMaxPiastres: toBigIntPiastres(d.adminFeeMaxEgp),
      insuranceRequired: d.insuranceRequired,
      earlySettlementFeeBps: d.earlySettlementFeeBps,
      latePaymentFeeBps: d.latePaymentFeeBps,
      heroImageUrl: d.heroImageUrl,
      isFeatured: d.isFeatured,
      isActive: d.isActive,
      businessLine: { connect: { id: d.businessLineId } },
      category: { connect: { id: d.categoryId } },
      updatedBy: { connect: { id: actor.id } },
    });
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

/**
 * Server-side validation against the chosen category's required attributes.
 * The form already client-side `required={...}`s the inputs, but a tampered
 * payload could omit them — so we recheck here.
 */
async function validateAgainstCategory(
  d: z.infer<typeof ProductInputSchema>,
): Promise<Record<string, string[]> | null> {
  const cat = await productCategoryRepository.findById(d.categoryId);
  if (!cat) return { categoryId: ["Category not found"] };
  const cfg = makeAttributeConfig(cat.enabledAttributes, cat.requiredAttributes);
  const fieldErrors: Record<string, string[]> = {};

  // Maps each required attribute to the form fields it covers and the rule.
  const REQUIRES: Record<ProductAttributeKey, () => { ok: boolean; fields: string[] }> = {
    amountRange: () => ({
      ok: d.amountMinEgp > 0 || d.amountMaxEgp > 0,
      fields: ["amountMinEgp", "amountMaxEgp"],
    }),
    tenureRange: () => ({
      ok: d.tenureMinMonths > 0 && d.tenureMaxMonths > 0,
      fields: ["tenureMinMonths", "tenureMaxMonths"],
    }),
    flatRate: () => ({ ok: d.flatInterestRateBps > 0, fields: ["flatInterestRateBps"] }),
    decliningRate: () => ({
      ok: d.decliningInterestRateBps > 0,
      fields: ["decliningInterestRateBps"],
    }),
    adminFee: () => ({ ok: d.adminFeeBps > 0, fields: ["adminFeeBps"] }),
    insurance: () => ({ ok: true, fields: [] }), // boolean — always satisfiable
    earlySettlement: () => ({
      ok: d.earlySettlementFeeBps > 0,
      fields: ["earlySettlementFeeBps"],
    }),
    latePayment: () => ({ ok: d.latePaymentFeeBps > 0, fields: ["latePaymentFeeBps"] }),
    eligibility: () => ({
      ok: Boolean(d.eligibilityEn?.trim()) && Boolean(d.eligibilityAr?.trim()),
      fields: ["eligibilityEn", "eligibilityAr"],
    }),
    documents: () => ({
      ok: d.documentsEn.length > 0 && d.documentsAr.length > 0,
      fields: ["documentsEn", "documentsAr"],
    }),
  };

  for (const key of cfg.required) {
    const { ok, fields } = REQUIRES[key]();
    if (!ok) {
      for (const f of fields) {
        fieldErrors[f] = [`Required by category "${cat.nameEn}"`];
      }
    }
  }

  return Object.keys(fieldErrors).length > 0 ? fieldErrors : null;
}
