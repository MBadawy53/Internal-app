import { Role } from "@prisma/client";
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

    // Admin → see everything.
    if (scope === "all") return lead;
    if (scope === "none") return null;

    const referrerIsAmbassador = lead.referredBy?.role === Role.AMBASSADOR;

    // Ambassador-managers see only ambassador-referred leads, in their BL.
    if (actor.role === Role.AMBASSADOR_MANAGER) {
      if (!referrerIsAmbassador) return null;
      if (actor.businessLineId && lead.businessLineId !== actor.businessLineId) return null;
      return lead;
    }

    // Everyone else is excluded from ambassador-referred leads — those now
    // belong to the ambassador-manager queue.
    if (referrerIsAmbassador) return null;

    if (lead.ownerEmployeeId === actor.id || lead.referredByEmployeeId === actor.id) {
      return lead;
    }
    if (!lead.ownerEmployeeId) return null;
    const owner = await prisma.user.findUnique({
      where: { id: lead.ownerEmployeeId },
      select: { invitedById: true },
    });
    return owner?.invitedById === actor.id ? lead : null;
  },
};
