import type { Prisma, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const userAdminRepository = {
  list: (filters: { q?: string } = {}) => {
    const q = filters.q?.trim();
    const where: Prisma.UserWhereInput | undefined = q
      ? {
          OR: [
            { groupId: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { nameEn: { contains: q, mode: "insensitive" } },
            { nameAr: { contains: q } },
            { phone: { contains: q } },
          ],
        }
      : undefined;
    return prisma.user.findMany({
      where,
      include: {
        businessLine: { select: { nameEn: true, nameAr: true, slug: true } },
        manager: { select: { id: true, groupId: true, nameEn: true } },
      },
      orderBy: [{ groupId: "asc" }, { email: "asc" }],
      take: 500,
    });
  },

  findByGroupId: (groupId: string) => prisma.user.findUnique({ where: { groupId } }),

  // Provision a new employee — group ID set, no password yet.
  provision: (data: {
    groupId: string;
    role: Role;
    businessLineId: string | null;
    managerId: string | null;
    referralCode: string;
    canEditProducts: boolean;
    canEditCatalog: boolean;
  }): Promise<Prisma.UserGetPayload<object>> =>
    prisma.user.create({
      data: {
        groupId: data.groupId,
        role: data.role,
        businessLineId: data.businessLineId,
        managerId: data.managerId,
        referralCode: data.referralCode,
        canEditProducts: data.canEditProducts,
        canEditCatalog: data.canEditCatalog,
        mustCompleteProfile: true,
        isActive: true,
      },
    }),

  setActive: (id: string, isActive: boolean) =>
    prisma.user.update({ where: { id }, data: { isActive } }),

  updateCapabilities: (
    id: string,
    data: {
      role: Role;
      businessLineId: string | null;
      managerId: string | null;
      canEditProducts: boolean;
      canEditCatalog: boolean;
    },
  ) => prisma.user.update({ where: { id }, data }),
};
