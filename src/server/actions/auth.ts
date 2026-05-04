"use server";

import { z } from "zod";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/lib/auth/config";
import { logger } from "@/lib/logger";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  from: z.string().optional(),
});

export type LoginActionState =
  | { ok: true }
  | { ok: false; error: "invalidCredentials" | "inactiveAccount" | "unknown"; message?: string };

export async function loginAction(
  _prev: LoginActionState | null,
  formData: FormData,
): Promise<LoginActionState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    from: formData.get("from") ?? undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: "invalidCredentials" };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password,
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
