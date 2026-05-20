import { z } from "zod";
import { NotificationType } from "@prisma/client";

/**
 * Discriminated payload shape per NotificationType. The DB stores this as
 * `Notification.payloadJson` (Prisma.JsonValue) — `notify()` accepts a typed
 * union so producers can't drift, and `readPayload()` validates on read so
 * the UI can't trip over a stale shape.
 */
export type NotificationPayload =
  | {
      type: typeof NotificationType.NEW_LEAD_FROM_QR;
      leadId: string;
      customerName: string;
      customerPhone: string;
      campaignSlug: string | null;
    }
  | {
      type: typeof NotificationType.NEW_LEAD_MANUAL;
      leadId: string;
      customerName: string;
      customerPhone: string;
      createdById: string;
    }
  | {
      type: typeof NotificationType.LEAD_ASSIGNED;
      leadId: string;
      customerName: string;
      newOwnerId: string;
      previousOwnerId: string;
    }
  | {
      type: typeof NotificationType.LEAD_STATUS_CHANGED;
      leadId: string;
      customerName: string;
      fromStatus: string;
      toStatus: string;
      reason: string | null;
      actorId: string;
    }
  | {
      type: typeof NotificationType.LEAD_REFERRED;
      leadId: string;
      customerName: string;
      referrerId: string;
    }
  | {
      type: typeof NotificationType.SUGGESTION_UPDATED;
      suggestionId: string;
      title: string;
      status: string;
      adminResponseChanged: boolean;
    }
  | {
      type: typeof NotificationType.SYSTEM;
      kind: string;
      [key: string]: unknown;
    };

const newLeadFromQr = z.object({
  type: z.literal(NotificationType.NEW_LEAD_FROM_QR),
  leadId: z.string(),
  customerName: z.string(),
  customerPhone: z.string(),
  campaignSlug: z.string().nullable(),
});

const newLeadManual = z.object({
  type: z.literal(NotificationType.NEW_LEAD_MANUAL),
  leadId: z.string(),
  customerName: z.string(),
  customerPhone: z.string(),
  createdById: z.string(),
});

const leadAssigned = z.object({
  type: z.literal(NotificationType.LEAD_ASSIGNED),
  leadId: z.string(),
  customerName: z.string(),
  newOwnerId: z.string(),
  previousOwnerId: z.string(),
});

const leadStatusChanged = z.object({
  type: z.literal(NotificationType.LEAD_STATUS_CHANGED),
  leadId: z.string(),
  customerName: z.string(),
  fromStatus: z.string(),
  toStatus: z.string(),
  reason: z.string().nullable(),
  actorId: z.string(),
});

const leadReferred = z.object({
  type: z.literal(NotificationType.LEAD_REFERRED),
  leadId: z.string(),
  customerName: z.string(),
  referrerId: z.string(),
});

const suggestionUpdated = z.object({
  type: z.literal(NotificationType.SUGGESTION_UPDATED),
  suggestionId: z.string(),
  title: z.string(),
  status: z.string(),
  adminResponseChanged: z.boolean(),
});

const systemPayload = z
  .object({ type: z.literal(NotificationType.SYSTEM), kind: z.string() })
  .passthrough();

export const notificationPayloadSchema = z.discriminatedUnion("type", [
  newLeadFromQr,
  newLeadManual,
  leadAssigned,
  leadStatusChanged,
  leadReferred,
  suggestionUpdated,
  systemPayload,
]);

/**
 * Safely parse a Notification.payloadJson value. Returns `null` if the
 * stored JSON doesn't match any known shape — callers should treat that as
 * "show a generic notification".
 */
export function readPayload(raw: unknown): NotificationPayload | null {
  const r = notificationPayloadSchema.safeParse(raw);
  return r.success ? (r.data as NotificationPayload) : null;
}
