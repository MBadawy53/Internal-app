import type { Prisma, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const userAdminRepository = {
  list: () =>
    prisma.user.findMany({
      include: {
        businessLine: { select: { nameEn: true, nameAr: true, slug: true } },
        manager: { select: { id: true, groupId: true, nameEn: true } },
      },
      orderBy: [{ groupId: "asc" }, { email: "asc" }],
    }),

  findByGroupId: (groupId: string) => prisma.user.findUnique({ where: { groupId } }),

  // Provision a new employee — group ID set, no password yet.
  provision: (data: {
    groupId: string;
    role: Role;
    businessLineId: string | null;
    managerId: string | null;
    referralCode: string;
  }): Promise<Prisma.UserGetPayload<object>> =>
    prisma.user.create({
      data: {
        groupId: data.groupId,
        role: data.role,
        businessLineId: data.businessLineId,
        managerId: data.managerId,
        referralCode: data.referralCode,
        mustCompleteProfile: true,
        isActive: true,
      },
    }),

  setActive: (id: string, isActive: boolean) =>
    prisma.user.update({ where: { id }, data: { isActive } }),
};
