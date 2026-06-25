"use server";

import { z } from "zod";
import argon2 from "argon2";
import { revalidatePath } from "next/cache";
import { requireActor } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export type ChangePasswordState =
  | { ok: true }
  | { ok: false; message: string; field?: "currentPassword" | "newPassword" | "confirmPassword" };

export type ProfileInfoField = "nameEn" | "nameAr" | "email" | "phone";
export type ProfileInfoState =
  | { ok: true }
  | { ok: false; message?: string; fieldErrors?: Partial<Record<ProfileInfoField, string>> };

const ProfileInfoSchema = z.object({
  nameEn: z.string().trim().min(2, "Name (EN) must be at least 2 characters").max(120),
  nameAr: z.string().trim().min(2, "Name (AR) must be at least 2 characters").max(120),
  email: z.string().email("Invalid email"),
  phone: z.string().regex(/^\+?[0-9\s-]{8,20}$/u, "Invalid phone number"),
});

export async function updateProfileInfoAction(
  _prev: ProfileInfoState | null,
  fd: FormData,
): Promise<ProfileInfoState> {
  const actor = await requireActor();

  const parsed = ProfileInfoSchema.safeParse({
    nameEn: fd.get("nameEn")?.toString() ?? "",
    nameAr: fd.get("nameAr")?.toString() ?? "",
    email: fd.get("email")?.toString() ?? "",
    phone: fd.get("phone")?.toString() ?? "",
  });
  if (!parsed.success) {
    const fieldErrors: Partial<Record<ProfileInfoField, string>> = {};
    for (const issue of parsed.error.errors) {
      const key = issue.path[0] as ProfileInfoField | undefined;
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, fieldErrors };
  }

  const nameEn = parsed.data.nameEn.trim();
  const nameAr = parsed.data.nameAr.trim();
  const email = parsed.data.email.toLowerCase();
  const phone = parsed.data.phone.trim();

  const conflict = await prisma.user.findFirst({
    where: { OR: [{ email }, { phone }], NOT: { id: actor.id } },
    select: { email: true, phone: true },
  });
  if (conflict) {
    const fieldErrors: Partial<Record<ProfileInfoField, string>> = {};
    if (conflict.email === email) fieldErrors.email = "Email is already in use";
    if (conflict.phone === phone) fieldErrors.phone = "Phone is already in use";
    return { ok: false, fieldErrors };
  }

  try {
    await prisma.user.update({
      where: { id: actor.id },
      data: { nameEn, nameAr, email, phone },
    });
    revalidatePath("/profile");
    return { ok: true };
  } catch (err) {
    if ((err as { code?: string }).code === "P2002") {
      return { ok: false, message: "Email or phone is already in use." };
    }
    logger.error({ err, userId: actor.id }, "profile.update_info_failed");
    return { ok: false, message: "Could not update profile. Please retry." };
  }
}

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
