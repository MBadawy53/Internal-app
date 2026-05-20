import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const qrCampaignRepository = {
  /**
   * List campaigns visible to the actor. Admin sees all; BL owner sees their
   * BL's; employee sees only their own.
   */
  listForActor: (actor: { id: string; role: string; businessLineId: string | null }) => {
    const where: Prisma.QrCampaignWhereInput =
      actor.role === "ADMIN"
        ? {}
        : actor.role === "BUSINESS_LINE_OWNER" && actor.businessLineId
          ? { employee: { businessLineId: actor.businessLineId } }
          : { employeeId: actor.id };
    return prisma.qrCampaign.findMany({
      where,
      include: {
        employee: { select: { id: true, nameEn: true, nameAr: true, email: true } },
        product: { select: { id: true, nameEn: true, nameAr: true } },
      },
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
      take: 500,
    });
  },

  findBySlug: (slug: string) =>
    prisma.qrCampaign.findUnique({
      where: { slug },
      include: {
        employee: {
          select: {
            id: true,
            nameEn: true,
            nameAr: true,
            email: true,
            businessLineId: true,
          },
        },
        product: true,
      },
    }),

  findActiveBySlug: (slug: string) =>
    prisma.qrCampaign.findFirst({
      where: { slug, isActive: true },
      include: {
        employee: {
          select: {
            id: true,
            nameEn: true,
            nameAr: true,
            role: true,
            businessLineId: true,
          },
        },
        product: true,
        leadFormTemplate: { select: { id: true, fields: true, isActive: true } },
      },
    }),

  create: (data: Prisma.QrCampaignCreateInput) =>
    prisma.qrCampaign.create({
      data,
      include: {
        employee: { select: { id: true, nameEn: true, nameAr: true } },
        product: { select: { id: true, nameEn: true, nameAr: true } },
      },
    }),

  setActive: (id: string, isActive: boolean) =>
    prisma.qrCampaign.update({ where: { id }, data: { isActive } }),

  recordScan: (params: {
    campaignId: string | null;
    referralCode: string;
    ip?: string;
    userAgent?: string;
    referer?: string;
  }) =>
    prisma.$transaction(async (tx) => {
      await tx.qrScan.create({
        data: {
          campaignId: params.campaignId ?? null,
          referralCode: params.referralCode,
          ip: params.ip ?? null,
          userAgent: params.userAgent ?? null,
          referer: params.referer ?? null,
        },
      });
      if (params.campaignId) {
        await tx.qrCampaign.update({
          where: { id: params.campaignId },
          data: { scanCount: { increment: 1 } },
        });
      }
    }),

  incrementLeadCount: (id: string) =>
    prisma.qrCampaign.update({
      where: { id },
      data: { leadCount: { increment: 1 } },
    }),
};
