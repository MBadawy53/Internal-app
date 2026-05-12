import type { NotificationType, Prisma } from "@prisma/client";
import { notificationRepository } from "@/server/repositories/notification.repository";
import { logger } from "@/lib/logger";

/**
 * Single entry point for emitting an in-app notification. Channel dispatch
 * (email / SMS / WhatsApp) lands in the next phase; for now we just persist
 * the `Notification` row and the user sees it on /notifications.
 *
 * Errors are swallowed and logged — a failed notification must never block
 * the operation that triggered it (lead create, status change, etc.).
 */
export async function notify(params: {
  userId: string;
  type: NotificationType;
  payload: Prisma.InputJsonValue;
}): Promise<void> {
  try {
    await notificationRepository.create({
      user: { connect: { id: params.userId } },
      type: params.type,
      payloadJson: params.payload,
    });
  } catch (err) {
    logger.error({ err, ...params }, "notify.failed");
  }
}
