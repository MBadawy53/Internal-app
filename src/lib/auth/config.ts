import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import * as argon2 from "argon2";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { edgeAuthConfig } from "./edge-config";
import "./types";

// Group ID format: C followed by 4 digits followed by C (employee, e.g. C0001C),
// or R followed by 4 digits followed by R (ambassador, e.g. R0001R).
export const EMPLOYEE_ID_REGEX = /^C\d{4}C$/u;
export const AMBASSADOR_ID_REGEX = /^R\d{4}R$/u;
export const GROUP_ID_REGEX = /^(?:C\d{4}C|R\d{4}R)$/u;

const CredentialsSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(1),
});

function isGroupId(value: string): boolean {
  return GROUP_ID_REGEX.test(value);
}

// Auth.js v5 — Credentials provider now, structured so SSO/AD providers can be
// added later by appending to the `providers` array without changing call sites.
// The `identifier` field accepts EITHER a group ID (C0001C–C9999C) or an email.
// Only the seeded break-glass admin uses email-only login.
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
        identifier: { label: "Group ID or Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (raw) => {
        const parsed = CredentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { identifier, password } = parsed.data;

        const user = isGroupId(identifier)
          ? await prisma.user.findUnique({ where: { groupId: identifier } })
          : await prisma.user.findUnique({ where: { email: identifier.toLowerCase() } });

        if (!user || !user.isActive || !user.passwordHash) {
          // No user, deactivated, or first-login pending → reject here.
          // The login form will route first-login users to /onboard separately.
          return null;
        }

        const ok = await argon2.verify(user.passwordHash, password).catch(() => false);
        if (!ok) {
          logger.warn({ identifier }, "auth.failed_login");
          return null;
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.nameEn ?? user.email ?? user.groupId,
          role: user.role,
          locale: user.locale,
          businessLineId: user.businessLineId,
          referralCode: user.referralCode,
          canEditProducts: user.canEditProducts,
          canEditCatalog: user.canEditCatalog,
        };
      },
    }),
  ],
  trustHost: env.AUTH_TRUST_HOST,
  secret: env.AUTH_SECRET,
});
