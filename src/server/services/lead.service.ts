import { prisma } from "@/lib/prisma";
import { leadRepository, type ListLeadFilters } from "@/server/repositories/lead.repository";
import { requirePermission, type ActorContext } from "@/lib/auth/permissions";

export const leadService = {
  list: async (actor: ActorContext, filters: ListLeadFilters = {}) => {
    const scope = requirePermission(actor, "list", "lead");
    return leadRepository.list(scope, actor, filters);
  },

  get: async (actor: ActorContext, id: string) => {
    const scope = requirePermission(actor, "read", "lead");
    const lead = await leadRepository.findById(id);
    if (!lead) return null;

    // Same scope→visibility rules as the list filter. Centralised here so
    // direct detail lookups can't bypass scope.
    switch (scope) {
      case "all":
        return lead;
      case "businessLine":
        return lead.businessLineId === actor.businessLineId ? lead : null;
      case "team": {
        if (lead.ownerEmployeeId === actor.id || lead.referredByEmployeeId === actor.id) {
          return lead;
        }
        if (!lead.ownerEmployeeId) return null;
        const owner = await prisma.user.findUnique({
          where: { id: lead.ownerEmployeeId },
          select: { managerId: true },
        });
        return owner?.managerId === actor.id ? lead : null;
      }
      case "own":
        return lead.ownerEmployeeId === actor.id || lead.referredByEmployeeId === actor.id
          ? lead
          : null;
      default:
        return null;
    }
  },
};
