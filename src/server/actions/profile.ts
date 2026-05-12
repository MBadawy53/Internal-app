"use server";

import { z } from "zod";
import argon2 from "argon2";
import { requireActor } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export type ChangePasswordState =
  | { ok: true }
  | { ok: false; message: string; field?: "currentPassword" | "newPassword" | "confirmPassword" };

const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm the new password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match",
  });

export async function changePasswordAction(
  _prev: ChangePasswordState | null,
  fd: FormData,
): Promise<ChangePasswordState> {
  const actor = await requireActor();

  const parsed = ChangePasswordSchema.safeParse({
    currentPassword: fd.get("currentPassword")?.toString() ?? "",
    newPassword: fd.get("newPassword")?.toString() ?? "",
    confirmPassword: fd.get("confirmPassword")?.toString() ?? "",
  });
  if (!parsed.success) {
    const issue = parsed.error.errors[0];
    return {
      ok: false,
      message: issue?.message ?? "Invalid input",
      field: (issue?.path[0] as "currentPassword" | "newPassword" | "confirmPassword") ?? undefined,
    };
  }
  const d = parsed.data;

  const user = await prisma.user.findUnique({
    where: { id: actor.id },
    select: { passwordHash: true },
  });
  if (!user?.passwordHash) {
    return { ok: false, message: "Your account has no password set." };
  }

  const valid = await argon2.verify(user.passwordHash, d.currentPassword);
  if (!valid) {
    return { ok: false, message: "Current password is incorrect.", field: "currentPassword" };
  }

  if (d.newPassword === d.currentPassword) {
    return {
      ok: false,
      message: "New password must be different from the current one.",
      field: "newPassword",
    };
  }

  try {
    const newHash = await argon2.hash(d.newPassword, { type: argon2.argon2id });
    await prisma.user.update({
      where: { id: actor.id },
      data: { passwordHash: newHash },
    });
    return { ok: true };
  } catch (err) {
    logger.error({ err, userId: actor.id }, "profile.change_password_failed");
    return { ok: false, message: "Could not update password. Please retry." };
  }
}
