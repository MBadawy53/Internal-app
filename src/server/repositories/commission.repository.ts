import type { CommissionPersona, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const commissionRepository = {
  /** All product commissions for the given persona, joined with their tiers. */
  listForPersona: (persona: CommissionPersona) =>
    prisma.productCommission.findMany({
      where: { persona, isActive: true },
      include: {
        product: {
          select: {
            id: true,
            nameEn: true,
            nameAr: true,
            businessLine: { select: { id: true, nameEn: true, nameAr: true } },
            isActive: true,
          },
        },
        tiers: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: { updatedAt: "desc" },
      take: 500,
    }),

  /** Single commission row + tiers for admin editing. */
  findForProduct: (productId: string, persona: CommissionPersona) =>
    prisma.productCommission.findUnique({
      where: { productId_persona: { productId, persona } },
      include: { tiers: { orderBy: { sortOrder: "asc" } } },
    }),

  /**
   * Replace the whole tier list for (product, persona). Creates the
   * ProductCommission row if missing. Tiers are wiped + recreated atomically.
   */
  replaceTiers: (
    productId: string,
    persona: CommissionPersona,
    notes: string | null,
    isActive: boolean,
    tiers: Array<{
      sortOrder: number;
      fromAmountPiastres: bigint;
      toAmountPiastres: bigint | null;
      ratePercentBps: number | null;
      flatPiastres: bigint | null;
      label: string | null;
    }>,
  ) =>
    prisma.$transaction(async (tx) => {
      const existing = await tx.productCommission.findUnique({
        where: { productId_persona: { productId, persona } },
        select: { id: true },
      });
      let commissionId: string;
      if (existing) {
        commissionId = existing.id;
        await tx.productCommission.update({
          where: { id: commissionId },
          data: { isActive, notes },
        });
        await tx.commissionTier.deleteMany({ where: { commissionId } });
      } else {
        const created = await tx.productCommission.create({
          data: { productId, persona, isActive, notes },
          select: { id: true },
        });
        commissionId = created.id;
      }
      if (tiers.length > 0) {
        await tx.commissionTier.createMany({
          data: tiers.map((t) => ({
            commissionId,
            sortOrder: t.sortOrder,
            fromAmountPiastres: t.fromAmountPiastres,
            toAmountPiastres: t.toAmountPiastres,
            ratePercentBps: t.ratePercentBps,
            flatPiastres: t.flatPiastres,
            label: t.label,
          })),
        });
      }
      return { commissionId };
    }),

  /** Products that have no commission row yet for the given persona. */
  productsWithoutCommission: async (persona: CommissionPersona) => {
    const existing = await prisma.productCommission.findMany({
      where: { persona },
      select: { productId: true },
    });
    const taken = new Set(existing.map((e) => e.productId));
    return prisma.product.findMany({
      where: { isActive: true, id: { notIn: Array.from(taken) } },
      select: { id: true, nameEn: true, nameAr: true },
      orderBy: { nameEn: "asc" },
    });
  },
};

export type CommissionWithTiers = Prisma.PromiseReturnType<
  typeof commissionRepository.findForProduct
>;
