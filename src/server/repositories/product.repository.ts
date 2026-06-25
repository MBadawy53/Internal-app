import type { Company, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export interface ListProductFilters {
  businessLineId?: string;
  categoryId?: string;
  company?: Company;
  amountMinPiastres?: bigint;
  amountMaxPiastres?: bigint;
  tenureMinMonths?: number;
  tenureMaxMonths?: number;
  query?: string;
  includeInactive?: boolean;
}

export const productRepository = {
  list: (filters: ListProductFilters = {}) => {
    const where: Prisma.ProductWhereInput = {};

    if (filters.businessLineId) where.businessLineId = filters.businessLineId;
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.company) where.company = filters.company;
    if (!filters.includeInactive) where.isActive = true;

    if (filters.amountMinPiastres !== undefined) {
      where.amountMaxPiastres = { gte: filters.amountMinPiastres };
    }
    if (filters.amountMaxPiastres !== undefined) {
      where.amountMinPiastres = { lte: filters.amountMaxPiastres };
    }
    if (filters.tenureMinMonths !== undefined) {
      where.tenureMaxMonths = { gte: filters.tenureMinMonths };
    }
    if (filters.tenureMaxMonths !== undefined) {
      where.tenureMinMonths = { lte: filters.tenureMaxMonths };
    }

    if (filters.query) {
      where.OR = [
        { nameEn: { contains: filters.query, mode: "insensitive" } },
        { nameAr: { contains: filters.query } },
      ];
    }

    return prisma.product.findMany({
      where,
      include: {
        businessLine: true,
        category: {
          include: {
            attributes: {
              include: { attribute: true },
              orderBy: { sortOrder: "desc" },
            },
          },
        },
        attributeValues: {
          include: { attribute: true },
          orderBy: { sortOrder: "desc" },
        },
      },
      orderBy: [{ isFeatured: "desc" }, { nameEn: "asc" }],
    });
  },

  findById: (id: string) =>
    prisma.product.findUnique({
      where: { id },
      include: {
        businessLine: true,
        category: {
          include: {
            attributes: {
              include: { attribute: true },
              orderBy: { sortOrder: "desc" },
            },
          },
        },
        attributeValues: {
          include: { attribute: true },
          orderBy: { sortOrder: "desc" },
        },
      },
    }),

  create: (data: Prisma.ProductCreateInput) =>
    prisma.product.create({
      data,
      include: { businessLine: true, category: true },
    }),

  update: (id: string, data: Prisma.ProductUpdateInput) =>
    prisma.product.update({
      where: { id },
      data,
      include: { businessLine: true, category: true },
    }),

  softDelete: (id: string, updatedById: string) =>
    prisma.product.update({
      where: { id },
      data: { isActive: false, updatedById },
    }),

  /**
   * Replace the full set of attribute values for a product, atomically.
   * Anything not in the new list is removed.
   */
  replaceAttributeValues: async (
    productId: string,
    values: Array<{ attributeId: string; value: Prisma.InputJsonValue; sortOrder: number }>,
  ) => {
    return prisma.$transaction([
      prisma.productAttributeValue.deleteMany({ where: { productId } }),
      ...values.map((v) =>
        prisma.productAttributeValue.create({
          data: {
            productId,
            attributeId: v.attributeId,
            value: v.value,
            sortOrder: v.sortOrder,
          },
        }),
      ),
    ]);
  },
};
