import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const quoteRepository = {
  listForEmployee: (employeeId: string) =>
    prisma.quote.findMany({
      where: { employeeId },
      include: { product: { include: { businessLine: true } } },
      orderBy: { createdAt: "desc" },
    }),
  findById: (id: string) =>
    prisma.quote.findUnique({
      where: { id },
      include: { product: { include: { businessLine: true } }, employee: true },
    }),
  create: (data: Prisma.QuoteCreateInput) => prisma.quote.create({ data }),
};
