"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AttributeType } from "@prisma/client";
import { requirePermission } from "@/lib/auth/permissions";
import { requireActor } from "@/lib/auth/session";
import { logger } from "@/lib/logger";
import { attributeRepository } from "@/server/repositories/attribute.repository";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
// Attribute keys may use dots for namespacing (e.g. "insurance.company-name").
const keyRegex = /^[a-z0-9]+(?:[-.][a-z0-9]+)*$/u;

const SelectOption = z.object({
  value: z.string().min(1).max(60).regex(slugRegex, "Option value must be kebab-case"),
  labelEn: z.string().min(1).max(120),
  labelAr: z.string().min(1).max(120),
});

const AttributeInputSchema = z
  .object({
    key: z
      .string()
      .min(2)
      .max(64)
      .regex(keyRegex, "Key must be lowercase letters, digits, hyphens or dots"),
    nameEn: z.string().min(1).max(120),
    nameAr: z.string().min(1).max(120),
    helpEn: z.string().max(500).optional().nullable(),
    helpAr: z.string().max(500).optional().nullable(),
    type: z.nativeEnum(AttributeType),
    options: z.array(SelectOption).default([]),
    sortOrder: z.coerce.number().int().min(0).default(0),
    isActive: z.coerce.boolean().default(true),
  })
  .refine((d) => d.type !== "SELECT" || d.options.length > 0, {
    path: ["options"],
    message: "SELECT attributes must have at least one option",
  });

export type AttributeActionState =
  | { ok: true; id: string }
  | { ok: false; fieldErrors?: Record<string, string[]>; message?: string };

function fromFormData(fd: FormData) {
  // Options are sent as parallel arrays.
  const optionValues = fd.getAll("optionValue").map((v) => v.toString());
  const optionLabelsEn = fd.getAll("optionLabelEn").map((v) => v.toString());
  const optionLabelsAr = fd.getAll("optionLabelAr").map((v) => v.toString());
  const options = optionValues
    .map((value, i) => ({
      value: value.trim(),
      labelEn: (optionLabelsEn[i] ?? "").trim(),
      labelAr: (optionLabelsAr[i] ?? "").trim(),
    }))
    .filter((o) => o.value.length > 0);

  return {
    key: fd.get("key")?.toString().trim() ?? "",
    nameEn: fd.get("nameEn")?.toString() ?? "",
    nameAr: fd.get("nameAr")?.toString() ?? "",
    helpEn: (fd.get("helpEn")?.toString() ?? "") || null,
    helpAr: (fd.get("helpAr")?.toString() ?? "") || null,
    type: fd.get("type") as AttributeType,
    options,
    sortOrder: fd.get("sortOrder")?.toString() ?? "0",
    isActive: fd.get("isActive") === "on" || fd.get("isActive") === "true",
  };
}

export async function createAttributeAction(
  _prev: AttributeActionState | null,
  formData: FormData,
): Promise<AttributeActionState> {
  const actor = await requireActor();
  requirePermission(actor, "create", "productAttribute");

  const parsed = AttributeInputSchema.safeParse(fromFormData(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    const created = await attributeRepository.create({
      key: parsed.data.key,
      nameEn: parsed.data.nameEn,
      nameAr: parsed.data.nameAr,
      helpEn: parsed.data.helpEn,
      helpAr: parsed.data.helpAr,
      type: parsed.data.type,
      options: parsed.data.type === "SELECT" ? { options: parsed.data.options } : undefined,
      sortOrder: parsed.data.sortOrder,
      isActive: parsed.data.isActive,
    });
    revalidatePath("/admin/attributes");
    revalidatePath("/admin/categories");
    redirect("/admin/attributes");
    return { ok: true, id: created.id };
  } catch (err) {
    logger.error({ err }, "attribute.create_failed");
    if ((err as { code?: string }).code === "P2002") {
      return { ok: false, fieldErrors: { key: ["Key already exists"] } };
    }
    throw err;
  }
}

export async function updateAttributeAction(
  id: string,
  _prev: AttributeActionState | null,
  formData: FormData,
): Promise<AttributeActionState> {
  const actor = await requireActor();
  requirePermission(actor, "update", "productAttribute");

  const parsed = AttributeInputSchema.safeParse(fromFormData(formData));
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await attributeRepository.update(id, {
      key: parsed.data.key,
      nameEn: parsed.data.nameEn,
      nameAr: parsed.data.nameAr,
      helpEn: parsed.data.helpEn,
      helpAr: parsed.data.helpAr,
      type: parsed.data.type,
      options:
        parsed.data.type === "SELECT" ? { options: parsed.data.options } : { set: undefined },
      sortOrder: parsed.data.sortOrder,
      isActive: parsed.data.isActive,
    });
    revalidatePath("/admin/attributes");
    revalidatePath("/admin/categories");
    redirect("/admin/attributes");
    return { ok: true, id };
  } catch (err) {
    logger.error({ err, id }, "attribute.update_failed");
    if ((err as { code?: string }).code === "P2002") {
      return { ok: false, fieldErrors: { key: ["Key already exists"] } };
    }
    throw err;
  }
}

export async function deactivateAttributeAction(id: string): Promise<void> {
  const actor = await requireActor();
  requirePermission(actor, "delete", "productAttribute");
  await attributeRepository.setActive(id, false);
  revalidatePath("/admin/attributes");
}
