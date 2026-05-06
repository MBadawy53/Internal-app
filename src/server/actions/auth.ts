"use server";

import { z } from "zod";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { GROUP_ID_REGEX, signIn, signOut } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

const LoginSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(1),
  from: z.string().optional(),
});

export type LoginActionState =
  | { ok: true }
  | {
      ok: false;
      error: "invalidCredentials" | "inactiveAccount" | "mustOnboard" | "unknown";
      groupId?: string;
      message?: string;
    };

function isGroupId(value: string): boolean {
  return GROUP_ID_REGEX.test(value);
}

export async function loginAction(
  _prev: LoginActionState | null,
  formData: FormData,
): Promise<LoginActionState> {
  const parsed = LoginSchema.safeParse({
    identifier: formData.get("identifier"),
    password: formData.get("password"),
    from: formData.get("from") ?? undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: "invalidCredentials" };
  }

  const { identifier, password } = parsed.data;
  const normalizedIdentifier = isGroupId(identifier) ? identifier : identifier.toLowerCase();

  // Pre-flight check: if the user exists but has no password yet, redirect to /onboard
  // instead of trying to authenticate. We do this before signIn so we can route the user
  // to the right flow with a useful message.
  const user = isGroupId(normalizedIdentifier)
    ? await prisma.user.findUnique({ where: { groupId: normalizedIdentifier } })
    : await prisma.user.findUnique({ where: { email: normalizedIdentifier } });

  if (!user || !user.isActive) {
    return { ok: false, error: "invalidCredentials" };
  }
  if (!user.passwordHash || user.mustCompleteProfile) {
    if (!user.groupId) return { ok: false, error: "invalidCredentials" };
    return { ok: false, error: "mustOnboard", groupId: user.groupId };
  }

  try {
    await signIn("credentials", {
      identifier: normalizedIdentifier,
      password,
      redirectTo:
        parsed.data.from && parsed.data.from.startsWith("/") ? parsed.data.from : "/dashboard",
    });
    return { ok: true };
  } catch (err) {
    if (err instanceof AuthError) {
      if (err.type === "CredentialsSignin") {
        return { ok: false, error: "invalidCredentials" };
      }
      logger.warn({ type: err.type }, "auth.signin_error");
      return { ok: false, error: "unknown" };
    }
    // next-auth uses redirects internally — re-throw to allow Next to handle them.
    throw err;
  }
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirect: false });
  redirect("/login");
}
