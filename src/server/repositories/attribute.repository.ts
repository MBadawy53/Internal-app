import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const attributeRepository = {
  list: () =>
    prisma.attribute.findMany({
      orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }],
    }),
  listActive: () =>
    prisma.attribute.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }],
    }),
  findById: (id: string) => prisma.attribute.findUnique({ where: { id } }),
  findByKey: (key: string) => prisma.attribute.findUnique({ where: { key } }),
  create: (data: Prisma.AttributeCreateInput) => prisma.attribute.create({ data }),
  update: (id: string, data: Prisma.AttributeUpdateInput) =>
    prisma.attribute.update({ where: { id }, data }),
  setActive: (id: string, isActive: boolean) =>
    prisma.attribute.update({ where: { id }, data: { isActive } }),
};
