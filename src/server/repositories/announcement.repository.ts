import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const announcementRepository = {
  list: () =>
    prisma.announcement.findMany({
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
      take: 200,
    }),

  /**
   * Active announcements visible to the given actor right now: `isActive`,
   * within the (optional) start/end window, and either no role filter or the
   * actor's role is listed; same for business line.
   */
  listVisible: async (actor: { role: Role; businessLineId: string | null }) => {
    const now = new Date();
    const rows = await prisma.announcement.findMany({
      where: {
        isActive: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return rows.filter((r) => {
      const roleOk = r.targetRoles.length === 0 || r.targetRoles.includes(actor.role);
      const blOk =
        r.targetBusinessLineIds.length === 0 ||
        (actor.businessLineId !== null && r.targetBusinessLineIds.includes(actor.businessLineId));
      return roleOk && blOk;
    });
  },

  findById: (id: string) => prisma.announcement.findUnique({ where: { id } }),

  remove: (id: string) => prisma.announcement.delete({ where: { id } }),
};
