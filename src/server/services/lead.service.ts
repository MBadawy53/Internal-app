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

    // Mirror the list filter: admin sees everything; everyone else sees
    // leads they own, leads they referred, or leads owned by ambassadors
    // they invited.
    if (scope === "all") return lead;
    if (scope === "none") return null;
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
