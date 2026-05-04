import { prisma } from "@/lib/prisma";

export const businessLineRepository = {
  list: () =>
    prisma.businessLine.findMany({
      where: { isActive: true },
      orderBy: { nameEn: "asc" },
    }),
  findById: (id: string) => prisma.businessLine.findUnique({ where: { id } }),
  findBySlug: (slug: string) => prisma.businessLine.findUnique({ where: { slug } }),
};
