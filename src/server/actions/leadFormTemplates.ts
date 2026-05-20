"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";
import { requireActor } from "@/lib/auth/session";
import { ForbiddenError } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { leadFormFieldsSchema, type LeadFormField } from "@/lib/leadForm/types";

export type SaveTemplateState = { ok: true; id: string } | { ok: false; message: string } | null;

const NameSchema = z.string().trim().min(2).max(80);

function requireAdmin(role: Role) {
  if (role !== Role.ADMIN) throw new ForbiddenError("Admin only");
}

function readFieldsFromJson(
  raw: string,
): { ok: true; fields: LeadFormField[] } | { ok: false; message: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, message: "Fields payload is not valid JSON." };
  }
  const r = leadFormFieldsSchema.safeParse(parsed);
  if (!r.success) {
    const issue = r.error.errors[0];
    return { ok: false, message: issue?.message ?? "Invalid field definition." };
  }
  // Reject duplicate field keys.
  const seen = new Set<string>();
  for (const f of r.data) {
    if (seen.has(f.id)) return { ok: false, message: `Duplicate field key: ${f.id}` };
    seen.add(f.id);
  }
  return { ok: true, fields: r.data };
}

export async function createLeadFormTemplateAction(
  _prev: SaveTemplateState,
  fd: FormData,
): Promise<SaveTemplateState> {
  const actor = await requireActor();
  requireAdmin(actor.role);

  const nameParsed = NameSchema.safeParse(fd.get("name")?.toString() ?? "");
  if (!nameParsed.success) {
    return { ok: false, message: "Name must be 2-80 characters." };
  }
  const fieldsRaw = fd.get("fields")?.toString() ?? "[]";
  const fields = readFieldsFromJson(fieldsRaw);
  if (!fields.ok) return fields;

  const makeDefault = fd.get("isDefault") === "on" || fd.get("isDefault") === "true";

  try {
    const created = await prisma.$transaction(async (tx) => {
      if (makeDefault) {
        await tx.leadFormTemplate.updateMany({
          where: { isDefault: true },
          data: { isDefault: false },
        });
      }
      return tx.leadFormTemplate.create({
        data: {
          name: nameParsed.data,
          isDefault: makeDefault,
          isActive: true,
          fields: fields.fields as unknown as object,
        },
        select: { id: true },
      });
    });
    revalidatePath("/admin/lead-form");
    revalidatePath("/leads/new");
    return { ok: true, id: created.id };
  } catch (err) {
    logger.error({ err }, "leadFormTemplate.create_failed");
    return { ok: false, message: "Could not save the template." };
  }
}

export async function updateLeadFormTemplateAction(
  templateId: string,
  _prev: SaveTemplateState,
  fd: FormData,
): Promise<SaveTemplateState> {
  const actor = await requireActor();
  requireAdmin(actor.role);
  if (!templateId) return { ok: false, message: "Missing template id" };

  const nameParsed = NameSchema.safeParse(fd.get("name")?.toString() ?? "");
  if (!nameParsed.success) {
    return { ok: false, message: "Name must be 2-80 characters." };
  }
  const fieldsRaw = fd.get("fields")?.toString() ?? "[]";
  const fields = readFieldsFromJson(fieldsRaw);
  if (!fields.ok) return fields;

  const makeDefault = fd.get("isDefault") === "on" || fd.get("isDefault") === "true";
  const isActive = fd.get("isActive") !== "off" && fd.get("isActive") !== "false";

  try {
    await prisma.$transaction(async (tx) => {
      if (makeDefault) {
        await tx.leadFormTemplate.updateMany({
          where: { isDefault: true, id: { not: templateId } },
          data: { isDefault: false },
        });
      }
      await tx.leadFormTemplate.update({
        where: { id: templateId },
        data: {
          name: nameParsed.data,
          isDefault: makeDefault,
          isActive,
          fields: fields.fields as unknown as object,
        },
      });
    });
    revalidatePath("/admin/lead-form");
    revalidatePath(`/admin/lead-form/${templateId}`);
    revalidatePath("/leads/new");
    return { ok: true, id: templateId };
  } catch (err) {
    logger.error({ err, templateId }, "leadFormTemplate.update_failed");
    return { ok: false, message: "Could not save the template." };
  }
}
