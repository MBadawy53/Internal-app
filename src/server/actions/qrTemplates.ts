"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { QrCampaignKind, Role } from "@prisma/client";
import { requireActor } from "@/lib/auth/session";
import { logger } from "@/lib/logger";
import { qrLandingTemplateRepository } from "@/server/repositories/qrLandingTemplate.repository";
import { prisma } from "@/lib/prisma";
import { smartDelete, type SmartDeleteResult } from "@/server/lib/smart-delete";

export type TemplateActionState = { ok: true; id: string } | { ok: false; message: string };

const TemplateSchema = z.object({
  name: z.string().min(2).max(120),
  kind: z.nativeEnum(QrCampaignKind).default(QrCampaignKind.LEAD_CAPTURE),
  headerImageUrl: z.string().url().max(500).optional().or(z.literal("")),
  titleEn: z.string().max(120).optional().or(z.literal("")),
  titleAr: z.string().max(120).optional().or(z.literal("")),
  subtitleEn: z.string().max(240).optional().or(z.literal("")),
  subtitleAr: z.string().max(240).optional().or(z.literal("")),
  bodyMdEn: z.string().max(5000).optional().or(z.literal("")),
  bodyMdAr: z.string().max(5000).optional().or(z.literal("")),
});

function readFields(fd: FormData) {
  return {
    name: fd.get("name")?.toString().trim() ?? "",
    kind: fd.get("kind")?.toString() || QrCampaignKind.LEAD_CAPTURE,
    headerImageUrl: fd.get("headerImageUrl")?.toString().trim() ?? "",
    titleEn: fd.get("titleEn")?.toString().trim() ?? "",
    titleAr: fd.get("titleAr")?.toString().trim() ?? "",
    subtitleEn: fd.get("subtitleEn")?.toString().trim() ?? "",
    subtitleAr: fd.get("subtitleAr")?.toString().trim() ?? "",
    bodyMdEn: fd.get("bodyMdEn")?.toString() ?? "",
    bodyMdAr: fd.get("bodyMdAr")?.toString() ?? "",
  };
}

function nullIfEmpty(v: string): string | null {
  return v.trim() === "" ? null : v;
}

async function adminOnly(): Promise<void> {
  const actor = await requireActor();
  if (actor.role !== Role.ADMIN) {
    throw new Error("Forbidden");
  }
}

export async function createTemplateAction(
  _prev: TemplateActionState | null,
  fd: FormData,
): Promise<TemplateActionState> {
  await adminOnly();
  const parsed = TemplateSchema.safeParse(readFields(fd));
  if (!parsed.success) {
    return { ok: false, message: parsed.error.errors[0]?.message ?? "Invalid input" };
  }
  const d = parsed.data;
  try {
    await qrLandingTemplateRepository.create({
      name: d.name,
      kind: d.kind,
      headerImageUrl: nullIfEmpty(d.headerImageUrl ?? ""),
      titleEn: nullIfEmpty(d.titleEn ?? ""),
      titleAr: nullIfEmpty(d.titleAr ?? ""),
      subtitleEn: nullIfEmpty(d.subtitleEn ?? ""),
      subtitleAr: nullIfEmpty(d.subtitleAr ?? ""),
      bodyMdEn: nullIfEmpty(d.bodyMdEn ?? ""),
      bodyMdAr: nullIfEmpty(d.bodyMdAr ?? ""),
    });
  } catch (err) {
    logger.error({ err }, "qrTemplate.create_failed");
    return { ok: false, message: "Could not create template" };
  }
  revalidatePath("/admin/qr-templates");
  redirect("/admin/qr-templates");
}

export async function updateTemplateAction(
  id: string,
  _prev: TemplateActionState | null,
  fd: FormData,
): Promise<TemplateActionState> {
  await adminOnly();
  const parsed = TemplateSchema.safeParse(readFields(fd));
  if (!parsed.success) {
    return { ok: false, message: parsed.error.errors[0]?.message ?? "Invalid input" };
  }
  const d = parsed.data;
  try {
    await qrLandingTemplateRepository.update(id, {
      name: d.name,
      kind: d.kind,
      headerImageUrl: nullIfEmpty(d.headerImageUrl ?? ""),
      titleEn: nullIfEmpty(d.titleEn ?? ""),
      titleAr: nullIfEmpty(d.titleAr ?? ""),
      subtitleEn: nullIfEmpty(d.subtitleEn ?? ""),
      subtitleAr: nullIfEmpty(d.subtitleAr ?? ""),
      bodyMdEn: nullIfEmpty(d.bodyMdEn ?? ""),
      bodyMdAr: nullIfEmpty(d.bodyMdAr ?? ""),
    });
    revalidatePath("/admin/qr-templates");
    revalidatePath(`/admin/qr-templates/${id}/edit`);
    return { ok: true, id };
  } catch (err) {
    logger.error({ err, id }, "qrTemplate.update_failed");
    return { ok: false, message: "Update failed" };
  }
}

export async function deleteTemplateAction(id: string): Promise<SmartDeleteResult> {
  await adminOnly();
  if (!id) return { ok: false, message: "Missing id" };
  const result = await smartDelete({
    label: "qrLandingTemplate",
    id,
    hard: () => prisma.qrLandingTemplate.delete({ where: { id } }),
    soft: () => prisma.qrLandingTemplate.update({ where: { id }, data: { isActive: false } }),
  });
  if (result.ok) {
    revalidatePath("/admin/qr-templates");
  }
  return result;
}

export async function setTemplateActiveAction(
  _prev: { ok: boolean } | null,
  fd: FormData,
): Promise<{ ok: boolean }> {
  await adminOnly();
  const id = fd.get("id")?.toString();
  const isActive = fd.get("isActive")?.toString() === "true";
  if (!id) return { ok: false };
  try {
    await qrLandingTemplateRepository.setActive(id, isActive);
    revalidatePath("/admin/qr-templates");
    return { ok: true };
  } catch (err) {
    logger.error({ err, id }, "qrTemplate.set_active_failed");
    return { ok: false };
  }
}
