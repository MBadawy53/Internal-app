import type { DefaultSession } from "next-auth";
import type { Role, Locale } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      locale: Locale;
      businessLineId: string | null;
      referralCode: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    locale: Locale;
    businessLineId: string | null;
    referralCode: string;
  }
}

export {};
