import type { Prisma, SuggestionStatus, SuggestionCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export interface SuggestionFilters {
  status?: SuggestionStatus;
  category?: SuggestionCategory;
}

const submitterSelect = {
  id: true,
  groupId: true,
  nameEn: true,
  nameAr: true,
  role: true,
} as const;

const responderSelect = {
  id: true,
  nameEn: true,
  nameAr: true,
} as const;

export const suggestionRepository = {
  /** List visible suggestions. Pass `submitterId` to scope to one user. */
  list: (params: { submitterId?: string; filters?: SuggestionFilters; limit?: number } = {}) => {
    const where: Prisma.SuggestionWhereInput = {};
    if (params.submitterId) where.submitterId = params.submitterId;
    if (params.filters?.status) where.status = params.filters.status;
    if (params.filters?.category) where.category = params.filters.category;
    return prisma.suggestion.findMany({
      where,
      include: {
        submitter: { select: submitterSelect },
        adminResponseBy: { select: responderSelect },
      },
      orderBy: { createdAt: "desc" },
      take: params.limit ?? 200,
    });
  },

  findById: (id: string) =>
    prisma.suggestion.findUnique({
      where: { id },
      include: {
        submitter: { select: submitterSelect },
        adminResponseBy: { select: responderSelect },
      },
    }),

  create: (data: Prisma.SuggestionCreateInput) => prisma.suggestion.create({ data }),

  /** Count of suggestions a user submitted within `windowMs` — for the rate limit. */
  countRecentBySubmitter: (submitterId: string, windowMs: number) =>
    prisma.suggestion.count({
      where: {
        submitterId,
        createdAt: { gt: new Date(Date.now() - windowMs) },
      },
    }),
};
