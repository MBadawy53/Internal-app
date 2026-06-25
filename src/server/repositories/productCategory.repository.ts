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
      include: {
        businessLine: true,
        attributes: {
          include: { attribute: true },
          orderBy: { sortOrder: "desc" },
        },
        _count: { select: { products: true } },
      },
      orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }],
    });
  },
  findById: (id: string) =>
    prisma.productCategory.findUnique({
      where: { id },
      include: {
        businessLine: true,
        attributes: {
          include: { attribute: true },
          orderBy: { sortOrder: "desc" },
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
   * Replace the full list of attributes a category enables, atomically.
   * Anything not in the new list is removed. Values are NOT stored here —
   * each Product fills in its own values via ProductAttributeValue.
   */
  replaceAttributes: async (
    categoryId: string,
    attributeIds: Array<{ attributeId: string; sortOrder: number }>,
  ) => {
    return prisma.$transaction([
      prisma.categoryAttribute.deleteMany({ where: { categoryId } }),
      ...attributeIds.map((a) =>
        prisma.categoryAttribute.create({
          data: {
            categoryId,
            attributeId: a.attributeId,
            sortOrder: a.sortOrder,
          },
        }),
      ),
    ]);
  },
};
