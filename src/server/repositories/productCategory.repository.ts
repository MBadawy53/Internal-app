import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export interface ListCategoryFilters {
  businessLineId?: string;
  includeInactive?: boolean;
}

export const productCategoryRepository = {
  list: (filters: ListCategoryFilters = {}) => {
    const where: Prisma.ProductCategoryWhereInput = {};
    if (filters.businessLineId) where.businessLineId = filters.businessLineId;
    if (!filters.includeInactive) where.isActive = true;
    return prisma.productCategory.findMany({
      where,
      include: { businessLine: true, _count: { select: { products: true } } },
      orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }],
    });
  },
  findById: (id: string) =>
    prisma.productCategory.findUnique({
      where: { id },
      include: {
        businessLine: true,
        attributeValues: {
          include: { attribute: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    }),
  findBySlug: (slug: string) =>
    prisma.productCategory.findUnique({
      where: { slug },
      include: { businessLine: true },
    }),
  create: (data: Prisma.ProductCategoryCreateInput) =>
    prisma.productCategory.create({ data, include: { businessLine: true } }),
  update: (id: string, data: Prisma.ProductCategoryUpdateInput) =>
    prisma.productCategory.update({ where: { id }, data, include: { businessLine: true } }),
  softDelete: (id: string, updatedById: string) =>
    prisma.productCategory.update({
      where: { id },
      data: { isActive: false, updatedById },
    }),

  /**
   * Replace the full set of attribute values for a category in one transaction.
   * Anything not in the new list is removed.
   */
  replaceAttributeValues: async (
    categoryId: string,
    values: Array<{ attributeId: string; value: Prisma.InputJsonValue; sortOrder: number }>,
  ) => {
    return prisma.$transaction([
      prisma.categoryAttributeValue.deleteMany({ where: { categoryId } }),
      ...values.map((v) =>
        prisma.categoryAttributeValue.create({
          data: {
            categoryId,
            attributeId: v.attributeId,
            value: v.value,
            sortOrder: v.sortOrder,
          },
        }),
      ),
    ]);
  },
};
