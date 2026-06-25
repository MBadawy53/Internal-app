"use server";

import { revalidatePath } from "next/cache";
import { LeadActivityType, NotificationType, Role } from "@prisma/client";
import { requireActor } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { ImageUploadError, uploadImage } from "@/lib/upload/image";
import { rateLimit } from "@/lib/rate-limit";
import { notify } from "@/server/services/notify.service";
import { hashLeadIdUploadToken, newLeadIdUploadToken } from "@/lib/leadIdUpload/token";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24h

function publicBase() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}

// ── Owner: mint a fresh link ───────────────────────────────────────────────

export type GenerateLinkState =
  | { ok: true; url: string; expiresAt: string }
  | { ok: false; message: string }
  | null;

/**
 * Issue an ID-upload link for a lead. Only the lead's current owner (or
 * an admin) can mint a link — this is the "assigned to me" gate the user
 * asked for; if the actor isn't the owner they should click Claim first.
 *
 * Multiple tokens per lead are allowed (regenerate if the customer lost
 * the link). Each token is single-use; whichever is redeemed first wins.
 */
export async function generateLeadIdUploadLinkAction(leadId: string): Promise<GenerateLinkState> {
  const actor = await requireActor();
  if (!leadId) return { ok: false, message: "Missing lead id" };

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { id: true, ownerEmployeeId: true },
  });
  if (!lead) return { ok: false, message: "Lead not found" };

  const isOwner = lead.ownerEmployeeId === actor.id;
  const isAdmin = actor.role === Role.ADMIN;
  if (!isOwner && !isAdmin) {
    return {
      ok: false,
      message: "Claim this lead first before sending an ID-upload link.",
    };
  }

  const { raw, hash } = newLeadIdUploadToken();
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);
  try {
    await prisma.leadIdUploadToken.create({
      data: {
        leadId: lead.id,
        tokenHash: hash,
        expiresAt,
        issuedById: actor.id,
      },
    });
  } catch (err) {
    logger.error({ err, leadId }, "leadIdUpload.issue_failed");
    return { ok: false, message: "Could not generate link, please retry." };
  }

  return {
    ok: true,
    url: `${publicBase()}/lead-id/${raw}`,
    expiresAt: expiresAt.toISOString(),
  };
}

// ── Public: submit front + back images via the link ────────────────────────

export type SubmitIdState =
  | { ok: true }
  | { ok: false; message?: string; fieldErrors?: Record<string, string> }
  | null;

export async function submitLeadIdUploadAction(
  _prev: SubmitIdState,
  fd: FormData,
): Promise<SubmitIdState> {
  // Cheap abuse cap. The token is the real gate (single-use, hashed).
  const ipKey = `lead-id-upload:${fd.get("token")?.toString().slice(0, 16) ?? "anon"}`;
  if (!rateLimit(ipKey, 5, 60 * 60 * 1000)) {
    return { ok: false, message: "Too many attempts, please try again later." };
  }

  const rawToken = fd.get("token")?.toString().trim();
  if (!rawToken) return { ok: false, message: "Missing link token." };

  const row = await prisma.leadIdUploadToken.findUnique({
    where: { tokenHash: hashLeadIdUploadToken(rawToken) },
    include: {
      lead: {
        select: { id: true, ownerEmployeeId: true, customerName: true },
      },
    },
  });
  if (!row || row.usedAt || row.expiresAt < new Date()) {
    return { ok: false, message: "This link is invalid or has expired." };
  }

  const frontFile = fd.get("front");
  const backFile = fd.get("back");
  const fieldErrors: Record<string, string> = {};
  if (!(frontFile instanceof File) || frontFile.size === 0) {
    fieldErrors.front = "Front side image is required.";
  }
  if (!(backFile instanceof File) || backFile.size === 0) {
    fieldErrors.back = "Back side image is required.";
  }
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }

  let frontUrl: string;
  let backUrl: string;
  try {
    frontUrl = await uploadImage(frontFile as File, `lead-id/${row.leadId}`);
    backUrl = await uploadImage(backFile as File, `lead-id/${row.leadId}`);
  } catch (err) {
    if (err instanceof ImageUploadError) {
      return { ok: false, message: err.message };
    }
    logger.error({ err, leadId: row.leadId }, "leadIdUpload.upload_failed");
    return { ok: false, message: "Upload failed, please retry." };
  }

  try {
    await prisma.$transaction([
      prisma.lead.update({
        where: { id: row.leadId },
        data: { nationalIdFrontUrl: frontUrl, nationalIdBackUrl: backUrl },
      }),
      prisma.leadIdUploadToken.update({
        where: { id: row.id },
        data: { usedAt: new Date() },
      }),
      // Invalidate any other outstanding tokens for the same lead so a
      // stale link can't be replayed once the customer has submitted.
      prisma.leadIdUploadToken.updateMany({
        where: { leadId: row.leadId, usedAt: null, id: { not: row.id } },
        data: { usedAt: new Date() },
      }),
      prisma.leadActivity.create({
        data: {
          leadId: row.leadId,
          type: LeadActivityType.FILE,
          content: "Customer submitted national ID (front + back).",
          actorId: row.issuedById,
        },
      }),
    ]);
  } catch (err) {
    logger.error({ err, leadId: row.leadId }, "leadIdUpload.persist_failed");
    return { ok: false, message: "Could not save your submission, please retry." };
  }

  // Notify the owner. Best-effort — never block on it.
  if (row.lead.ownerEmployeeId) {
    await notify({
      userId: row.lead.ownerEmployeeId,
      payload: {
        type: NotificationType.LEAD_ID_UPLOADED,
        leadId: row.leadId,
        customerName: row.lead.customerName,
      },
    });
  }

  revalidatePath(`/leads/${row.leadId}`);
  return { ok: true };
}
