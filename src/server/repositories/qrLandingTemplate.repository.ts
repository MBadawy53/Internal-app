import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const qrLandingTemplateRepository = {
  list: () =>
    prisma.qrLandingTemplate.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),

  listAll: () =>
    prisma.qrLandingTemplate.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
    }),

  findById: (id: string) => prisma.qrLandingTemplate.findUnique({ where: { id } }),

  create: (data: Prisma.QrLandingTemplateCreateInput) => prisma.qrLandingTemplate.create({ data }),

  update: (id: string, data: Prisma.QrLandingTemplateUpdateInput) =>
    prisma.qrLandingTemplate.update({ where: { id }, data }),

  setActive: (id: string, isActive: boolean) =>
    prisma.qrLandingTemplate.update({ where: { id }, data: { isActive } }),
};
