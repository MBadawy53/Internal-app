import type { Prisma } from "@prisma/client";
import { QrCampaignKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { readFields, type LeadFormField } from "@/lib/leadForm/types";

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

  /**
   * For the internal /leads/new flow: pick the oldest active LEAD_CAPTURE
   * campaign whose customFields array is non-empty. The first match wins —
   * this is the implicit source-of-truth for "what fields should the
   * internal lead form ask?" without introducing a separate settings table.
   * Returns { id, fields } or null if no campaign has any custom fields.
   */
  findFirstWithCustomFields: async (): Promise<{
    id: string;
    fields: LeadFormField[];
  } | null> => {
    const candidates = await prisma.qrCampaign.findMany({
      where: { isActive: true, kind: QrCampaignKind.LEAD_CAPTURE },
      orderBy: { createdAt: "asc" },
      select: { id: true, customFields: true },
      take: 50,
    });
    for (const c of candidates) {
      const fields = readFields(c.customFields);
      if (fields.length > 0) return { id: c.id, fields };
    }
    return null;
  },
};
