import type { Prisma, LeadStatus, LeadSource } from "@prisma/client";
import { LeadActivityType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { Scope } from "@/lib/auth/rbac";

export interface ListLeadFilters {
  status?: LeadStatus;
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
    if (filters.status) where.currentStatus = filters.status;
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
        owner: { select: { id: true, nameEn: true, nameAr: true, email: true } },
        referredBy: { select: { id: true, nameEn: true, nameAr: true, email: true } },
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
        owner: { select: { id: true, nameEn: true, nameAr: true, email: true } },
        referredBy: { select: { id: true, nameEn: true, nameAr: true, email: true } },
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

  /**
   * Apply a status transition atomically: update the lead's currentStatus,
   * append a LeadStatusHistory row, and auto-log a STATUS_CHANGE activity so
   * the timeline reflects it.
   */
  transition: (params: {
    leadId: string;
    fromStatus: LeadStatus;
    toStatus: LeadStatus;
    reason: string | null;
    note: string | null;
    actorId: string;
  }) =>
    prisma.$transaction([
      prisma.lead.update({
        where: { id: params.leadId },
        data: { currentStatus: params.toStatus, currentStatusReason: params.reason ?? null },
      }),
      prisma.leadStatusHistory.create({
        data: {
          leadId: params.leadId,
          fromStatus: params.fromStatus,
          toStatus: params.toStatus,
          reason: params.reason,
          note: params.note,
          actorId: params.actorId,
        },
      }),
      prisma.leadActivity.create({
        data: {
          leadId: params.leadId,
          type: LeadActivityType.STATUS_CHANGE,
          content: `${params.fromStatus} → ${params.toStatus}${params.reason ? `: ${params.reason}` : ""}`,
          actorId: params.actorId,
        },
      }),
    ]),

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
