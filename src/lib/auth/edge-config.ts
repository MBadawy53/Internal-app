import type { NextAuthConfig } from "next-auth";
import type { Role, Locale } from "@prisma/client";

interface AppJwtClaims {
  role: Role;
  locale: Locale;
  businessLineId: string | null;
  referralCode: string;
}

/**
 * Edge-safe Auth.js base config — NO providers that import Node-only modules
 * (argon2, prisma, etc). Used by middleware.ts so it can run on the Edge runtime.
 * The full config (`./config.ts`) extends this with the Credentials provider.
 */
export const edgeAuthConfig = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [], // populated in ./config.ts
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        const claims: AppJwtClaims = {
          role: user.role,
          locale: user.locale,
          businessLineId: user.businessLineId,
          referralCode: user.referralCode,
        };
        Object.assign(token, claims);
      }
      return token;
    },
    session: async ({ session, token }) => {
      const claims = token as unknown as AppJwtClaims & { sub?: string };
      if (claims.sub) session.user.id = claims.sub;
      session.user.role = claims.role;
      session.user.locale = claims.locale;
      session.user.businessLineId = claims.businessLineId;
      session.user.referralCode = claims.referralCode;
      return session;
    },
  },
} satisfies NextAuthConfig;
