import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const productVariableRepository = {
  listForProduct: (productId: string) =>
    prisma.productVariable.findMany({
      where: { productId },
      orderBy: { sortOrder: "asc" },
    }),
  create: (data: Prisma.ProductVariableCreateInput) => prisma.productVariable.create({ data }),
  update: (id: string, data: Prisma.ProductVariableUpdateInput) =>
    prisma.productVariable.update({ where: { id }, data }),
  delete: (id: string) => prisma.productVariable.delete({ where: { id } }),
  /**
   * Replace the full list of variables for a product in a single transaction.
   * Used by the product edit form which manages variables as a sub-collection.
   */
  replaceAll: async (
    productId: string,
    variables: Array<{
      nameEn: string;
      nameAr: string;
      descriptionEn?: string | null;
      descriptionAr?: string | null;
      sortOrder: number;
    }>,
  ) => {
    return prisma.$transaction([
      prisma.productVariable.deleteMany({ where: { productId } }),
      ...variables.map((v, idx) =>
        prisma.productVariable.create({
          data: {
            productId,
            nameEn: v.nameEn,
            nameAr: v.nameAr,
            descriptionEn: v.descriptionEn ?? null,
            descriptionAr: v.descriptionAr ?? null,
            sortOrder: v.sortOrder ?? idx,
          },
        }),
      ),
    ]);
  },
};
