import { prisma } from "@/lib/prisma";

export const userRepository = {
  findByEmail: (email: string) => prisma.user.findUnique({ where: { email: email.toLowerCase() } }),
  findById: (id: string) => prisma.user.findUnique({ where: { id } }),
  findByReferralCode: (referralCode: string) => prisma.user.findUnique({ where: { referralCode } }),
};
