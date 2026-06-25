"use server";

import { z } from "zod";
import * as argon2 from "argon2";
import { headers } from "next/headers";
import { Role } from "@prisma/client";
import { requireActor } from "@/lib/auth/session";
import { ForbiddenError } from "@/lib/auth/permissions";
import { GROUP_ID_REGEX } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { hashResetToken, newResetToken } from "@/lib/passwordReset/token";
import { sendPasswordResetLink } from "@/lib/notify/passwordReset";

const RESET_TTL_MS = 30 * 60 * 1000; // 30 minutes

function publicBase() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}

function buildResetUrl(raw: string): string {
  return `${publicBase()}/reset/${raw}`;
}

// ── 1. Self-serve: request a reset link ────────────────────────────────────

export type RequestResetState = { ok: true } | { ok: false; message: string } | null;

const RequestSchema = z.object({
  identifier: z.string().trim().min(1).max(120),
});

/**
 * Public action — anyone can submit. Returns the same generic success
 * regardless of whether the account exists, to prevent account enumeration.
 * Rate-limited per IP + per identifier.
 */
export async function requestPasswordResetAction(
  _prev: RequestResetState,
  fd: FormData,
): Promise<RequestResetState> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "unknown";

  if (!rateLimit(`pwd-reset-ip:${ip}`, 10, 60 * 60 * 1000)) {
    return { ok: false, message: "Too many requests. Please try again later." };
  }

  const parsed = RequestSchema.safeParse({
    identifier: fd.get("identifier")?.toString() ?? "",
  });
  if (!parsed.success) {
    // Still generic — don't reveal validity.
    return { ok: true };
  }
  const raw = parsed.data.identifier.trim();
  // Identifier can be a group ID or email. We always answer success.
  const identifier = raw.toUpperCase();

  if (!rateLimit(`pwd-reset-id:${identifier}`, 5, 60 * 60 * 1000)) {
    return { ok: true };
  }

  const lookup = GROUP_ID_REGEX.test(identifier)
    ? { groupId: identifier }
    : { email: raw.toLowerCase() };

  const user = await prisma.user.findUnique({
    where: lookup,
    select: {
      id: true,
      role: true,
      email: true,
      phone: true,
      nameEn: true,
      isActive: true,
      passwordHash: true,
    },
  });

  if (!user || !user.isActive || !user.passwordHash) {
    // Generic success — do not signal existence.
    logger.info({ identifier }, "passwordReset.request.no_match");
    return { ok: true };
  }

  const { raw: token, hash } = newResetToken();
  try {
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hash,
        expiresAt: new Date(Date.now() + RESET_TTL_MS),
        requestIp: ip,
      },
    });
  } catch (err) {
    logger.error({ err, userId: user.id }, "passwordReset.request.persist_failed");
    return { ok: true };
  }

  const link = buildResetUrl(token);
  try {
    await sendPasswordResetLink(
      {
        id: user.id,
        role: user.role,
        email: user.email,
        phone: user.phone,
        nameEn: user.nameEn,
      },
      link,
    );
  } catch (err) {
    logger.error({ err, userId: user.id }, "passwordReset.request.delivery_failed");
  }
  return { ok: true };
}

// ── 2. Public: redeem the reset link ───────────────────────────────────────

export type ResetPasswordState =
  | { ok: true }
  | { ok: false; message?: string; fieldErrors?: Record<string, string> }
  | null;

const ResetSchema = z
  .object({
    token: z.string().min(16),
    password: z.string().min(8).max(128),
    passwordConfirm: z.string(),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    path: ["passwordConfirm"],
    message: "Passwords don't match",
  });

export async function resetPasswordAction(
  _prev: ResetPasswordState,
  fd: FormData,
): Promise<ResetPasswordState> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "unknown";
  if (!rateLimit(`pwd-reset-redeem:${ip}`, 20, 60 * 60 * 1000)) {
    return { ok: false, message: "Too many requests. Please try again later." };
  }

  const parsed = ResetSchema.safeParse({
    token: fd.get("token")?.toString() ?? "",
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

  const row = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashResetToken(d.token) },
    include: { user: { select: { id: true, isActive: true } } },
  });
  if (!row || row.usedAt || row.expiresAt < new Date() || !row.user.isActive) {
    return { ok: false, message: "This reset link is invalid or has expired." };
  }

  const passwordHash = await argon2.hash(d.password, { type: argon2.argon2id });
  try {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: row.userId },
        data: { passwordHash, mustCompleteProfile: false },
      }),
      // Mark this token used …
      prisma.passwordResetToken.update({
        where: { id: row.id },
        data: { usedAt: new Date() },
      }),
      // … and invalidate every other outstanding token for this user.
      prisma.passwordResetToken.updateMany({
        where: { userId: row.userId, usedAt: null, id: { not: row.id } },
        data: { usedAt: new Date() },
      }),
    ]);
  } catch (err) {
    logger.error({ err, userId: row.userId }, "passwordReset.redeem.update_failed");
    return { ok: false, message: "Could not reset your password. Please retry." };
  }

  return { ok: true };
}

// ── 3. Admin: issue a reset link directly (fallback when channel is down) ──

export type AdminIssueResetState =
  | { ok: true; resetUrl: string }
  | { ok: false; message: string }
  | null;

export async function adminIssuePasswordResetAction(
  _prev: AdminIssueResetState,
  fd: FormData,
): Promise<AdminIssueResetState> {
  const actor = await requireActor();
  if (actor.role !== Role.ADMIN) throw new ForbiddenError("Admin only");

  const userId = fd.get("userId")?.toString();
  if (!userId) return { ok: false, message: "Missing user id" };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, isActive: true, passwordHash: true },
  });
  if (!user) return { ok: false, message: "User not found" };
  if (!user.isActive) return { ok: false, message: "User is inactive" };
  if (!user.passwordHash) {
    return { ok: false, message: "User hasn't completed onboarding yet." };
  }

  const { raw, hash } = newResetToken();
  try {
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hash,
        expiresAt: new Date(Date.now() + RESET_TTL_MS),
        issuedById: actor.id,
      },
    });
  } catch (err) {
    logger.error({ err, userId }, "passwordReset.admin_issue.persist_failed");
    return { ok: false, message: "Could not issue a reset link." };
  }

  return { ok: true, resetUrl: buildResetUrl(raw) };
}
