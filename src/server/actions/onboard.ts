"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import * as argon2 from "argon2";
import { GROUP_ID_REGEX, signIn } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

const OnboardSchema = z
  .object({
    groupId: z.string().regex(GROUP_ID_REGEX, "Invalid group ID format"),
    nameEn: z.string().min(2).max(120),
    nameAr: z.string().min(2).max(120),
    email: z.string().email(),
    phone: z.string().regex(/^\+?[0-9\s-]{8,20}$/u, "Invalid phone number"),
    password: z.string().min(8).max(128),
    passwordConfirm: z.string(),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    path: ["passwordConfirm"],
    message: "Passwords don't match",
  });

export type OnboardActionState =
  | { ok: true }
  | { ok: false; fieldErrors?: Record<string, string[]>; message?: string };

export async function onboardAction(
  _prev: OnboardActionState | null,
  formData: FormData,
): Promise<OnboardActionState> {
  const parsed = OnboardSchema.safeParse({
    groupId: formData.get("groupId")?.toString() ?? "",
    nameEn: formData.get("nameEn")?.toString() ?? "",
    nameAr: formData.get("nameAr")?.toString() ?? "",
    email: formData.get("email")?.toString() ?? "",
    phone: formData.get("phone")?.toString() ?? "",
    password: formData.get("password")?.toString() ?? "",
    passwordConfirm: formData.get("passwordConfirm")?.toString() ?? "",
  });

  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { groupId, nameEn, nameAr, email, phone, password } = parsed.data;

  // The user must exist with this group ID, be active, and not yet have a password.
  const user = await prisma.user.findUnique({ where: { groupId } });
  if (!user || !user.isActive) {
    return { ok: false, message: "Group ID not found or account is inactive." };
  }
  if (user.passwordHash && !user.mustCompleteProfile) {
    return { ok: false, message: "This account is already activated. Please sign in." };
  }

  const normalizedEmail = email.toLowerCase();

  // Email/phone uniqueness check (Prisma unique constraints will also catch this).
  const conflict = await prisma.user.findFirst({
    where: {
      OR: [{ email: normalizedEmail }, { phone }],
      NOT: { id: user.id },
    },
    select: { id: true, email: true, phone: true },
  });
  if (conflict) {
    const fieldErrors: Record<string, string[]> = {};
    if (conflict.email === normalizedEmail) fieldErrors.email = ["Email is already in use"];
    if (conflict.phone === phone) fieldErrors.phone = ["Phone is already in use"];
    return { ok: false, fieldErrors };
  }

  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        nameEn,
        nameAr,
        email: normalizedEmail,
        phone,
        mustCompleteProfile: false,
      },
    });
  } catch (err) {
    logger.error({ err, groupId }, "onboard.update_failed");
    if ((err as { code?: string }).code === "P2002") {
      return { ok: false, message: "Email or phone is already in use." };
    }
    throw err;
  }

  // Auto-sign-in the freshly activated user.
  try {
    await signIn("credentials", {
      identifier: groupId,
      password,
      redirectTo: "/dashboard",
    });
    return { ok: true };
  } catch (err) {
    // next-auth throws a redirect to complete the sign-in; let Next handle it.
    throw err;
  }
}

export async function startOnboardAction(formData: FormData): Promise<void> {
  const groupId = formData.get("groupId")?.toString() ?? "";
  if (!GROUP_ID_REGEX.test(groupId)) redirect("/login?error=invalid");
  redirect(`/onboard?groupId=${encodeURIComponent(groupId)}`);
}
