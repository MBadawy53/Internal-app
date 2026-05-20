import type { Prisma } from "@prisma/client";
import { notificationRepository } from "@/server/repositories/notification.repository";
import { logger } from "@/lib/logger";
import type { NotificationPayload } from "@/lib/notifications/payload";

/**
 * Single entry point for emitting an in-app notification. Channel dispatch
 * (email / SMS / WhatsApp) lands in the next phase; for now we just persist
 * the `Notification` row and the user sees it on /notifications.
 *
 * Errors are swallowed and logged — a failed notification must never block
 * the operation that triggered it (lead create, status change, etc.).
 *
 * `payload` is a discriminated union (`src/lib/notifications/payload.ts`);
 * the `type` literal inside `payload` drives both the DB enum column and
 * the JSON shape, so producers can't drift between the two.
 */
export async function notify(params: {
  userId: string;
  payload: NotificationPayload;
}): Promise<void> {
  try {
    await notificationRepository.create({
      user: { connect: { id: params.userId } },
      type: params.payload.type,
      payloadJson: params.payload as unknown as Prisma.InputJsonValue,
    });
  } catch (err) {
    logger.error({ err, userId: params.userId, type: params.payload.type }, "notify.failed");
  }
}
