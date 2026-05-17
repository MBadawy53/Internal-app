"use server";

import { z } from "zod";
import * as argon2 from "argon2";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { AmbassadorApplicationStatus, QrCampaignKind, Role } from "@prisma/client";
import { signIn } from "@/lib/auth/config";
import { requireActor } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { ImageUploadError, uploadImage } from "@/lib/upload/image";
import { hashInviteToken, newInviteToken } from "@/lib/invite/token";
import { qrCampaignRepository } from "@/server/repositories/qrCampaign.repository";

// ── Public submit ──────────────────────────────────────────────────────────

const SubmitSchema = z.object({
  code: z.string().min(2).max(40),
  name: z.string().trim().min(2).max(160),
  phone: z.string().regex(/^\+?[0-9\s-]{8,20}$/u, "Invalid phone number"),
  company: z.string().optional(), // honeypot
});

export type SubmitApplicationState =
  | { ok: true }
  | { ok: false; message?: string; fieldErrors?: Record<string, string> };

/** Public action invoked from /r/<slug> when campaign.kind = AMBASSADOR_INVITE. */
export async function submitAmbassadorApplicationAction(
  _prev: SubmitApplicationState | null,
  fd: FormData,
): Promise<SubmitApplicationState> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "unknown";
  if (!rateLimit(`ambassador-app:${ip}`, 5, 60 * 60 * 1000)) {
    return { ok: false, message: "Too many requests, please try again later." };
  }

  const parsed = SubmitSchema.safeParse({
    code: fd.get("code")?.toString() ?? "",
    name: fd.get("name")?.toString() ?? "",
    phone: fd.get("phone")?.toString() ?? "",
    company: fd.get("company")?.toString() ?? "",
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.errors) {
      const k = issue.path[0]?.toString();
      if (k && !fieldErrors[k]) fieldErrors[k] = issue.message;
    }
    return { ok: false, fieldErrors };
  }
  const d = parsed.data;
  if (d.company && d.company.trim() !== "") {
    // Honeypot — silently pretend success.
    return { ok: true };
  }

  const campaign = await qrCampaignRepository.findActiveBySlug(d.code);
  if (!campaign || campaign.kind !== QrCampaignKind.AMBASSADOR_INVITE) {
    return { ok: false, message: "This invitation link is not valid." };
  }
  if (campaign.employee.role === Role.AMBASSADOR) {
    return { ok: false, message: "Forbidden" };
  }

  // Optional national ID image upload (we accept missing for now; the
  // employee can still approve from name + phone alone).
  let nationalIdImageUrl: string | null = null;
  const image = fd.get("nationalIdImage");
  if (image instanceof File && image.size > 0) {
    try {
      nationalIdImageUrl = await uploadImage(image, "ambassador-applications/id");
    } catch (err) {
      if (err instanceof ImageUploadError) {
        return { ok: false, fieldErrors: { nationalIdImage: err.message } };
      }
      logger.error({ err }, "ambassadorApp.upload_failed");
      return { ok: false, message: "Image upload failed, please retry." };
    }
  }

  try {
    await prisma.ambassadorApplication.create({
      data: {
        campaignId: campaign.id,
        employeeId: campaign.employee.id,
        name: d.name.trim(),
        phone: d.phone.trim(),
        nationalIdImageUrl,
      },
    });
    revalidatePath("/ambassadors");
    return { ok: true };
  } catch (err) {
    logger.error({ err }, "ambassadorApp.create_failed");
    return { ok: false, message: "Could not submit, please retry." };
  }
}

// ── Approve / Reject (employee) ────────────────────────────────────────────

export type ReviewState = { ok: true; inviteUrl?: string } | { ok: false; message: string };

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function publicBase() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}

export async function approveAmbassadorApplicationAction(
  _prev: ReviewState | null,
  fd: FormData,
): Promise<ReviewState> {
  const actor = await requireActor();
  const id = fd.get("id")?.toString();
  if (!id) return { ok: false, message: "Missing id" };

  const app = await prisma.ambassadorApplication.findUnique({ where: { id } });
  if (!app) return { ok: false, message: "Application not found" };
  // Owner of the campaign or admin can review.
  if (actor.role !== Role.ADMIN && app.employeeId !== actor.id) {
    return { ok: false, message: "Forbidden" };
  }
  if (app.status !== AmbassadorApplicationStatus.PENDING) {
    return { ok: false, message: "Already reviewed" };
  }

  const { raw, hash } = newInviteToken();
  try {
    await prisma.ambassadorApplication.update({
      where: { id },
      data: {
        status: AmbassadorApplicationStatus.APPROVED,
        approvedAt: new Date(),
        approvedById: actor.id,
        inviteTokenHash: hash,
        inviteTokenExpiresAt: new Date(Date.now() + INVITE_TTL_MS),
      },
    });
  } catch (err) {
    logger.error({ err, id }, "ambassadorApp.approve_failed");
    return { ok: false, message: "Could not approve, please retry." };
  }
  revalidatePath("/ambassadors");
  return { ok: true, inviteUrl: `${publicBase()}/invite/${raw}` };
}

export async function rejectAmbassadorApplicationAction(
  _prev: ReviewState | null,
  fd: FormData,
): Promise<ReviewState> {
  const actor = await requireActor();
  const id = fd.get("id")?.toString();
  const reason = fd.get("reason")?.toString().trim() ?? "";
  if (!id) return { ok: false, message: "Missing id" };

  const app = await prisma.ambassadorApplication.findUnique({ where: { id } });
  if (!app) return { ok: false, message: "Application not found" };
  if (actor.role !== Role.ADMIN && app.employeeId !== actor.id) {
    return { ok: false, message: "Forbidden" };
  }
  if (app.status !== AmbassadorApplicationStatus.PENDING) {
    return { ok: false, message: "Already reviewed" };
  }
  try {
    await prisma.ambassadorApplication.update({
      where: { id },
      data: {
        status: AmbassadorApplicationStatus.REJECTED,
        rejectedAt: new Date(),
        rejectedReason: reason || null,
      },
    });
  } catch (err) {
    logger.error({ err, id }, "ambassadorApp.reject_failed");
    return { ok: false, message: "Could not reject, please retry." };
  }
  revalidatePath("/ambassadors");
  return { ok: true };
}

// ── Accept invite (public, from /invite/<token>) ───────────────────────────

export type AcceptInviteState =
  | { ok: true }
  | { ok: false; message?: string; fieldErrors?: Record<string, string> };

const AcceptSchema = z
  .object({
    token: z.string().min(8),
    phone: z.string().regex(/^\+?[0-9\s-]{8,20}$/u, "Invalid phone number"),
    password: z.string().min(8).max(128),
    passwordConfirm: z.string(),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    path: ["passwordConfirm"],
    message: "Passwords don't match",
  });

async function nextAmbassadorGroupId(): Promise<string> {
  const last = await prisma.user.findFirst({
    where: { role: Role.AMBASSADOR, groupId: { startsWith: "R" } },
    orderBy: { groupId: "desc" },
    select: { groupId: true },
  });
  const n = last?.groupId?.match(/^R(\d{4})R$/u)?.[1];
  const next = (n ? Number.parseInt(n, 10) : 0) + 1;
  if (next > 9999) throw new Error("Ambassador ID space exhausted");
  return `R${next.toString().padStart(4, "0")}R`;
}

export async function acceptAmbassadorInviteAction(
  _prev: AcceptInviteState | null,
  fd: FormData,
): Promise<AcceptInviteState> {
  const parsed = AcceptSchema.safeParse({
    token: fd.get("token")?.toString() ?? "",
    phone: fd.get("phone")?.toString() ?? "",
    password: fd.get("password")?.toString() ?? "",
    passwordConfirm: fd.get("passwordConfirm")?.toString() ?? "",
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.errors) {
      const k = issue.path[0]?.toString();
      if (k && !fieldErrors[k]) fieldErrors[k] = issue.message;
    }
    return { ok: false, fieldErrors };
  }
  const d = parsed.data;

  const app = await prisma.ambassadorApplication.findFirst({
    where: { inviteTokenHash: hashInviteToken(d.token) },
  });
  if (
    !app ||
    app.status !== AmbassadorApplicationStatus.APPROVED ||
    !app.inviteTokenExpiresAt ||
    app.inviteTokenExpiresAt < new Date()
  ) {
    return { ok: false, message: "This invite link is invalid or has expired." };
  }
  if (app.acceptedAt) {
    return { ok: false, message: "This invite has already been used." };
  }
  // Verify the phone the candidate entered matches what they applied with.
  if (d.phone.trim() !== app.phone) {
    return { ok: false, fieldErrors: { phone: "Phone does not match the application." } };
  }

  const existing = await prisma.user.findUnique({ where: { phone: app.phone } });
  if (existing) {
    return { ok: false, message: "This phone is already registered." };
  }

  const passwordHash = await argon2.hash(d.password, { type: argon2.argon2id });
  let groupId: string | null = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = await nextAmbassadorGroupId();
    try {
      const user = await prisma.user.create({
        data: {
          groupId: candidate,
          referralCode: candidate,
          role: Role.AMBASSADOR,
          nameEn: app.name,
          nameAr: app.name,
          phone: app.phone,
          passwordHash,
          invitedById: app.employeeId,
          mustCompleteProfile: false,
          isActive: true,
        },
      });
      await prisma.ambassadorApplication.update({
        where: { id: app.id },
        data: { acceptedAt: new Date(), createdUserId: user.id },
      });
      groupId = candidate;
      break;
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === "P2002") continue;
      logger.error({ err }, "ambassadorApp.accept_failed");
      return { ok: false, message: "Could not create your account, please retry." };
    }
  }
  if (!groupId) return { ok: false, message: "Could not allocate an ID; please retry." };

  try {
    await signIn("credentials", {
      identifier: groupId,
      password: d.password,
      redirectTo: "/dashboard",
    });
    return { ok: true };
  } catch (err) {
    throw err;
  }
}
