import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import * as argon2 from "argon2";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { edgeAuthConfig } from "./edge-config";
import "./types";

const CredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Auth.js v5 — Credentials provider now, structured so SSO/AD providers can be added later
// by appending to the `providers` array without changing call sites.
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...edgeAuthConfig,
  session: {
    strategy: "jwt",
    maxAge: env.SESSION_MAX_AGE_SECONDS,
    updateAge: Math.floor(env.SESSION_MAX_AGE_SECONDS / 4),
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (raw) => {
        const parsed = CredentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
        if (!user || !user.isActive) return null;

        const ok = await argon2.verify(user.passwordHash, password).catch(() => false);
        if (!ok) {
          logger.warn({ email }, "auth.failed_login");
          return null;
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.nameEn,
          role: user.role,
          locale: user.locale,
          businessLineId: user.businessLineId,
          referralCode: user.referralCode,
        };
      },
    }),
  ],
  trustHost: env.AUTH_TRUST_HOST,
  secret: env.AUTH_SECRET,
});
