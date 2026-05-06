"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { requirePermission } from "@/lib/auth/permissions";
import { requireActor } from "@/lib/auth/session";
import { logger } from "@/lib/logger";
import { productCategoryRepository } from "@/server/repositories/productCategory.repository";
import { attributeRepository } from "@/server/repositories/attribute.repository";
import { isProductAttributeKey } from "@/lib/catalog/attributes";
import { coerceAttributeValue, type AttributeOptionsJson } from "@/lib/catalog/attribute-values";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

const CategoryInputSchema = z.object({
  slug: z.string().min(2).max(64).regex(slugRegex, "Slug must be kebab-case"),
  businessLineId: z.string().min(1),
  nameEn: z.string().min(1).max(120),
  nameAr: z.string().min(1).max(120),
  descriptionEn: z.string().max(2000).optional().nullable(),
  descriptionAr: z.string().max(2000).optional().nullable(),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.coerce.boolean().default(true),
  enabledAttributes: z.array(z.string()).default([]),
  requiredAttributes: z.array(z.string()).default([]),
  attributeIds: z.array(z.string()).default([]),
  attributeValues: z.array(z.string()).default([]),
});

export type CategoryActionState =
  | { ok: true; id: string }
  | { ok: false; fieldErrors?: Record<string, string[]>; message?: string };

function fromFormData(fd: FormData) {
  // Form sends one hidden input per enabled / required attribute, all named
  // identically. Filter to only the keys we recognise (defensive against
  // tampered submissions).
  const enabledAttributes = fd
    .getAll("enabledAttributes")
    .map((v) => v.toString())
    .filter((s) => isProductAttributeKey(s));
  const requiredAttributes = fd
    .getAll("requiredAttributes")
    .map((v) => v.toString())
    .filter((s) => isProductAttributeKey(s) && enabledAttributes.includes(s));

  // Custom attribute selections — parallel arrays.
  const attributeIds = fd
    .getAll("attributeId")
    .map((v) => v.toString())
    .filter(Boolean);
  const attributeValues = fd.getAll("attributeValue").map((v) => v.toString());

  return {
    slug: fd.get("slug")?.toString() ?? "",
    businessLineId: fd.get("businessLineId")?.toString() ?? "",
    nameEn: fd.get("nameEn")?.toString() ?? "",
    nameAr: fd.get("nameAr")?.toString() ?? "",
    descriptionEn: (fd.get("descriptionEn")?.toString() ?? "") || null,
    descriptionAr: (fd.get("descriptionAr")?.toString() ?? "") || null,
    sortOrder: fd.get("sortOrder")?.toString() ?? "0",
    isActive: fd.get("isActive") === "on" || fd.get("isActive") === "true",
    enabledAttributes,
    requiredAttributes,
    attributeIds,
    attributeValues,
  };
}

/**
 * Coerce + persist the category's selected attributes against the master
 * attribute registry. Returns null on success or fieldErrors on a problem.
 */
async function persistAttributeValues(
  categoryId: string,
  attributeIds: string[],
  rawValues: string[],
): Promise<Record<string, string[]> | null> {
  if (attributeIds.length === 0) {
    await productCategoryRepository.replaceAttributeValues(categoryId, []);
    return null;
  }
  const attributes = await Promise.all(attributeIds.map((id) => attributeRepository.findById(id)));
  const fieldErrors: Record<string, string[]> = {};
  const values: Array<{ attributeId: string; value: Prisma.InputJsonValue; sortOrder: number }> =
    [];
  attributes.forEach((attr, i) => {
    if (!attr) {
      fieldErrors.attributeId = ["Unknown attribute"];
      return;
    }
    const opts = (attr.options as AttributeOptionsJson | null)?.options ?? [];
    try {
      const coerced = coerceAttributeValue(attr.type, rawValues[i] ?? "", opts);
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
  await productCategoryRepository.replaceAttributeValues(categoryId, values);
  return null;
}

export async function createCategoryAction(
  _prev: CategoryActionState | null,
  formData: FormData,
): Promise<CategoryActionState> {
  const actor = await requireActor();
  requirePermission(actor, "create", "productCategory");

  const parsed = CategoryInputSchema.safeParse(fromFormData(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    const created = await productCategoryRepository.create({
      slug: parsed.data.slug,
      nameEn: parsed.data.nameEn,
      nameAr: parsed.data.nameAr,
      descriptionEn: parsed.data.descriptionEn,
      descriptionAr: parsed.data.descriptionAr,
      sortOrder: parsed.data.sortOrder,
      isActive: parsed.data.isActive,
      enabledAttributes: parsed.data.enabledAttributes,
      requiredAttributes: parsed.data.requiredAttributes,
      businessLine: { connect: { id: parsed.data.businessLineId } },
    });
    const attrErrors = await persistAttributeValues(
      created.id,
      parsed.data.attributeIds,
      parsed.data.attributeValues,
    );
    if (attrErrors) return { ok: false, fieldErrors: attrErrors };
    revalidatePath("/admin/categories");
    revalidatePath("/catalog");
    redirect(`/admin/categories`);
    return { ok: true, id: created.id };
  } catch (err) {
    logger.error({ err }, "category.create_failed");
    if ((err as { code?: string }).code === "P2002") {
      return { ok: false, fieldErrors: { slug: ["Slug already exists"] } };
    }
    throw err;
  }
}

export async function updateCategoryAction(
  id: string,
  _prev: CategoryActionState | null,
  formData: FormData,
): Promise<CategoryActionState> {
  const actor = await requireActor();
  requirePermission(actor, "update", "productCategory");

  const parsed = CategoryInputSchema.safeParse(fromFormData(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await productCategoryRepository.update(id, {
      slug: parsed.data.slug,
      nameEn: parsed.data.nameEn,
      nameAr: parsed.data.nameAr,
      descriptionEn: parsed.data.descriptionEn,
      descriptionAr: parsed.data.descriptionAr,
      sortOrder: parsed.data.sortOrder,
      isActive: parsed.data.isActive,
      enabledAttributes: parsed.data.enabledAttributes,
      requiredAttributes: parsed.data.requiredAttributes,
      businessLine: { connect: { id: parsed.data.businessLineId } },
      updatedById: actor.id,
    });
    const attrErrors = await persistAttributeValues(
      id,
      parsed.data.attributeIds,
      parsed.data.attributeValues,
    );
    if (attrErrors) return { ok: false, fieldErrors: attrErrors };
    revalidatePath("/admin/categories");
    revalidatePath("/catalog");
    redirect(`/admin/categories`);
    return { ok: true, id };
  } catch (err) {
    logger.error({ err, id }, "category.update_failed");
    if ((err as { code?: string }).code === "P2002") {
      return { ok: false, fieldErrors: { slug: ["Slug already exists"] } };
    }
    throw err;
  }
}

export async function deleteCategoryAction(id: string): Promise<void> {
  const actor = await requireActor();
  requirePermission(actor, "delete", "productCategory");
  await productCategoryRepository.softDelete(id, actor.id);
  revalidatePath("/admin/categories");
  revalidatePath("/catalog");
}
