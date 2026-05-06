"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/permissions";
import { requireActor } from "@/lib/auth/session";
import { logger } from "@/lib/logger";
import { productCategoryRepository } from "@/server/repositories/productCategory.repository";
import { isProductAttributeKey } from "@/lib/catalog/attributes";

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
  };
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
