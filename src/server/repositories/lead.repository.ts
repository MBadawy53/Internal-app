import type { Prisma, LeadActivityType, LeadAppStatus, LeadSource } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { Scope } from "@/lib/auth/rbac";

export interface ListLeadFilters {
  appStatus?: LeadAppStatus;
  source?: LeadSource;
  businessLineId?: string;
  ownerEmployeeId?: string;
  query?: string; // name or phone
  fromDate?: Date;
  toDate?: Date;
}

/**
 * Translate the actor's RBAC scope into a Prisma where clause. The repository
 * is the single place where scope→query happens, so service / action layers
 * just hand us the scope they were granted.
 *
 * Visibility policy (current):
 *   - `all`    → admin sees every lead.
 *   - anything else → "own" view: leads I own, leads I referred, OR leads owned
 *                     by an ambassador I invited. Team/BL/own all collapse to
 *                     this rule.
 */
function scopeFilter(
  scope: Scope,
  actor: { id: string; businessLineId: string | null },
): Prisma.LeadWhereInput {
  if (scope === "all") return {};
  if (scope === "none") return { id: "__none__" };
  return {
    OR: [
      { ownerEmployeeId: actor.id },
      { referredByEmployeeId: actor.id },
      { owner: { invitedById: actor.id } },
    ],
  };
}

export const leadRepository = {
  list: (
    scope: Scope,
    actor: { id: string; businessLineId: string | null },
    filters: ListLeadFilters = {},
  ) => {
    const where: Prisma.LeadWhereInput = { ...scopeFilter(scope, actor) };
    if (filters.appStatus) where.appStatus = filters.appStatus;
    if (filters.source) where.source = filters.source;
    if (filters.businessLineId) where.businessLineId = filters.businessLineId;
    if (filters.ownerEmployeeId) where.ownerEmployeeId = filters.ownerEmployeeId;
    if (filters.fromDate || filters.toDate) {
      where.createdAt = {
        ...(filters.fromDate ? { gte: filters.fromDate } : {}),
        ...(filters.toDate ? { lte: filters.toDate } : {}),
      };
    }
    if (filters.query) {
      where.OR = [
        ...(where.OR ?? []),
        { customerName: { contains: filters.query, mode: "insensitive" } },
        { customerPhone: { contains: filters.query } },
      ];
    }
    return prisma.lead.findMany({
      where,
      include: {
        businessLine: true,
        owner: { select: { id: true, nameEn: true, nameAr: true, email: true, role: true } },
        referredBy: {
          select: { id: true, nameEn: true, nameAr: true, email: true, role: true },
        },
        product: { select: { id: true, nameEn: true, nameAr: true } },
      },
      orderBy: [{ createdAt: "desc" }],
      take: 500,
    });
  },

  findById: (id: string) =>
    prisma.lead.findUnique({
      where: { id },
      include: {
        businessLine: true,
        owner: { select: { id: true, nameEn: true, nameAr: true, email: true, role: true } },
        referredBy: {
          select: { id: true, nameEn: true, nameAr: true, email: true, role: true },
        },
        product: { select: { id: true, nameEn: true, nameAr: true } },
        campaign: { select: { id: true, name: true, slug: true, customFields: true } },
        history: {
          include: { actor: { select: { id: true, nameEn: true, nameAr: true } } },
          orderBy: { createdAt: "desc" },
        },
        activities: {
          include: { actor: { select: { id: true, nameEn: true, nameAr: true } } },
          orderBy: { createdAt: "desc" },
        },
        quotes: { orderBy: { createdAt: "desc" }, take: 10 },
      },
    }),

  create: (data: Prisma.LeadCreateInput) =>
    prisma.lead.create({ data, include: { businessLine: true } }),

  addActivity: (params: {
    leadId: string;
    type: LeadActivityType;
    content: string;
    actorId: string;
  }) =>
    prisma.leadActivity.create({
      data: {
        leadId: params.leadId,
        type: params.type,
        content: params.content,
        actorId: params.actorId,
      },
    }),
};
