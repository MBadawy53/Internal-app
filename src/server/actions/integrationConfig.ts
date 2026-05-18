"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { IntegrationKey, Role } from "@prisma/client";
import { requireActor } from "@/lib/auth/session";
import { ForbiddenError } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/crypto/aes-gcm";
import { logger } from "@/lib/logger";
import { integrationConfigRepository } from "@/server/repositories/integrationConfig.repository";

const WhatsAppSchema = z.object({
  accessToken: z.string().min(0).max(2000),
  phoneNumberId: z.string().trim().max(80),
  businessAccountId: z.string().trim().max(80).optional().or(z.literal("")),
  isEnabled: z.coerce.boolean().default(false),
});

const EmailSchema = z.object({
  smtpHost: z.string().trim().max(200),
  smtpPort: z.coerce.number().int().min(1).max(65535),
  smtpUser: z.string().trim().max(200),
  smtpPass: z.string().max(2000),
  smtpSecure: z.coerce.boolean().default(false),
  fromAddress: z.string().email().max(200),
  fromName: z.string().trim().max(120),
  isEnabled: z.coerce.boolean().default(false),
});

export type SaveConfigState = { ok: true } | { ok: false; message: string };

async function adminOnly() {
  const actor = await requireActor();
  if (actor.role !== Role.ADMIN) throw new ForbiddenError("Admin only");
  return actor;
}

async function upsert(key: IntegrationKey, value: object, isEnabled: boolean, actorId: string) {
  const json = JSON.stringify(value);
  const enc = encrypt(json);
  await prisma.integrationConfig.upsert({
    where: { key },
    update: { valueEncJson: enc, isEnabled, updatedById: actorId },
    create: { key, valueEncJson: enc, isEnabled, updatedById: actorId },
  });
}

export async function saveWhatsAppConfigAction(
  _prev: SaveConfigState | null,
  fd: FormData,
): Promise<SaveConfigState> {
  const actor = await adminOnly();
  const parsed = WhatsAppSchema.safeParse({
    accessToken: fd.get("accessToken")?.toString() ?? "",
    phoneNumberId: fd.get("phoneNumberId")?.toString() ?? "",
    businessAccountId: fd.get("businessAccountId")?.toString() ?? "",
    isEnabled: fd.get("isEnabled") === "on" || fd.get("isEnabled") === "true",
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.errors[0]?.message ?? "Invalid input" };
  }
  const d = parsed.data;
  // Preserve existing secret if the admin left the token blank.
  const existing = await integrationConfigRepository.decryptedFor<{ accessToken?: string }>(
    IntegrationKey.WHATSAPP_PROVIDER,
  );
  const accessToken =
    d.accessToken.trim() !== "" ? d.accessToken.trim() : (existing?.accessToken ?? "");
  if (!accessToken && d.isEnabled) {
    return { ok: false, message: "Access token is required when enabling WhatsApp." };
  }
  try {
    await upsert(
      IntegrationKey.WHATSAPP_PROVIDER,
      {
        accessToken,
        phoneNumberId: d.phoneNumberId,
        businessAccountId: d.businessAccountId || null,
      },
      d.isEnabled,
      actor.id,
    );
    revalidatePath("/configuration");
    return { ok: true };
  } catch (err) {
    logger.error({ err }, "config.whatsapp.save_failed");
    return { ok: false, message: "Could not save, please retry." };
  }
}

export async function saveEmailConfigAction(
  _prev: SaveConfigState | null,
  fd: FormData,
): Promise<SaveConfigState> {
  const actor = await adminOnly();
  const parsed = EmailSchema.safeParse({
    smtpHost: fd.get("smtpHost")?.toString() ?? "",
    smtpPort: fd.get("smtpPort")?.toString() ?? "0",
    smtpUser: fd.get("smtpUser")?.toString() ?? "",
    smtpPass: fd.get("smtpPass")?.toString() ?? "",
    smtpSecure: fd.get("smtpSecure") === "on" || fd.get("smtpSecure") === "true",
    fromAddress: fd.get("fromAddress")?.toString() ?? "",
    fromName: fd.get("fromName")?.toString() ?? "",
    isEnabled: fd.get("isEnabled") === "on" || fd.get("isEnabled") === "true",
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.errors[0]?.message ?? "Invalid input" };
  }
  const d = parsed.data;
  const existing = await integrationConfigRepository.decryptedFor<{ smtpPass?: string }>(
    IntegrationKey.EMAIL_PROVIDER,
  );
  const smtpPass = d.smtpPass.trim() !== "" ? d.smtpPass : (existing?.smtpPass ?? "");
  if (!smtpPass && d.isEnabled) {
    return { ok: false, message: "SMTP password is required when enabling email." };
  }
  try {
    await upsert(
      IntegrationKey.EMAIL_PROVIDER,
      {
        smtpHost: d.smtpHost,
        smtpPort: d.smtpPort,
        smtpUser: d.smtpUser,
        smtpPass,
        smtpSecure: d.smtpSecure,
        fromAddress: d.fromAddress,
        fromName: d.fromName,
      },
      d.isEnabled,
      actor.id,
    );
    revalidatePath("/configuration");
    return { ok: true };
  } catch (err) {
    logger.error({ err }, "config.email.save_failed");
    return { ok: false, message: "Could not save, please retry." };
  }
}
