import type { Prisma, NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const notificationRepository = {
  /** Latest notifications for the user, capped to a sensible page. */
  listForUser: (userId: string, limit = 50) =>
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),

  unreadCount: (userId: string) => prisma.notification.count({ where: { userId, readAt: null } }),

  markRead: (id: string, userId: string) =>
    prisma.notification.updateMany({
      where: { id, userId, readAt: null },
      data: { readAt: new Date() },
    }),

  markAllRead: (userId: string) =>
    prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    }),

  create: (data: Prisma.NotificationCreateInput) => prisma.notification.create({ data }),
};

export type { NotificationType };
