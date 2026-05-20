"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { NotificationType, Role } from "@prisma/client";
import { requireActor } from "@/lib/auth/session";
import { ForbiddenError } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { announcementRepository } from "@/server/repositories/announcement.repository";
import { ImageUploadError, uploadImage } from "@/lib/upload/image";
import { logger } from "@/lib/logger";
import { smartDelete, type SmartDeleteResult } from "@/server/lib/smart-delete";

const Schema = z
  .object({
    titleEn: z.string().trim().min(2).max(160),
    titleAr: z.string().trim().min(2).max(160),
    bodyEn: z.string().trim().min(2).max(5000),
    bodyAr: z.string().trim().min(2).max(5000),
    targetRoles: z.array(z.nativeEnum(Role)).default([]),
    targetBusinessLineIds: z.array(z.string().min(1)).default([]),
    startsAt: z
      .string()
      .optional()
      .transform((s) => (s && s.length > 0 ? new Date(s) : null)),
    endsAt: z
      .string()
      .optional()
      .transform((s) => (s && s.length > 0 ? new Date(s) : null)),
    isActive: z.coerce.boolean().default(true),
    sendNotification: z.coerce.boolean().default(false),
  })
  .refine((d) => !d.startsAt || !d.endsAt || d.endsAt > d.startsAt, {
    path: ["endsAt"],
    message: "End date must be after start date.",
  });

export type AnnouncementState = { ok: true; id: string } | { ok: false; message: string };

function adminOnly(role: Role) {
  if (role !== Role.ADMIN) throw new ForbiddenError("Admin only");
}

async function pushNotificationsToTargets(args: {
  announcementId: string;
  titleEn: string;
  titleAr: string;
  targetRoles: Role[];
  targetBusinessLineIds: string[];
}) {
  const whereRole = args.targetRoles.length > 0 ? { role: { in: args.targetRoles } } : {};
  const whereBL =
    args.targetBusinessLineIds.length > 0
      ? { businessLineId: { in: args.targetBusinessLineIds } }
      : {};
  const users = await prisma.user.findMany({
    where: { isActive: true, ...whereRole, ...whereBL },
    select: { id: true },
    take: 5000,
  });
  if (users.length === 0) return;
  await prisma.notification
    .createMany({
      data: users.map((u) => ({
        userId: u.id,
        type: NotificationType.SYSTEM,
        // payloadJson mirrors the NotificationPayload shape from
        // src/lib/notifications/payload.ts so readPayload() can validate
        // it on the dashboard read path. createMany is used here (rather
        // than notify() per row) because announcements fan out to all
        // matched users in one shot.
        payloadJson: {
          type: NotificationType.SYSTEM,
          kind: "ANNOUNCEMENT",
          announcementId: args.announcementId,
          titleEn: args.titleEn,
          titleAr: args.titleAr,
        },
      })),
    })
    .catch(() => undefined);
}

function readFields(fd: FormData) {
  return {
    titleEn: fd.get("titleEn")?.toString() ?? "",
    titleAr: fd.get("titleAr")?.toString() ?? "",
    bodyEn: fd.get("bodyEn")?.toString() ?? "",
    bodyAr: fd.get("bodyAr")?.toString() ?? "",
    targetRoles: fd.getAll("targetRoles").map((v) => v.toString()) as Role[],
    targetBusinessLineIds: fd.getAll("targetBusinessLineIds").map((v) => v.toString()),
    startsAt: fd.get("startsAt")?.toString() ?? "",
    endsAt: fd.get("endsAt")?.toString() ?? "",
    isActive: fd.get("isActive") === "on" || fd.get("isActive") === "true",
    sendNotification: fd.get("sendNotification") === "on" || fd.get("sendNotification") === "true",
  };
}

export async function createAnnouncementAction(
  _prev: AnnouncementState | null,
  fd: FormData,
): Promise<AnnouncementState> {
  const actor = await requireActor();
  adminOnly(actor.role);

  const parsed = Schema.safeParse(readFields(fd));
  if (!parsed.success) {
    return { ok: false, message: parsed.error.errors[0]?.message ?? "Invalid input" };
  }
  const d = parsed.data;

  // Optional image upload.
  let imageUrl: string | null = null;
  const image = fd.get("image");
  if (image instanceof File && image.size > 0) {
    try {
      imageUrl = await uploadImage(image, "announcements/banner");
    } catch (err) {
      if (err instanceof ImageUploadError) {
        return { ok: false, message: err.message };
      }
      logger.error({ err }, "announcement.upload_failed");
      return { ok: false, message: "Image upload failed, please retry." };
    }
  }

  let created: { id: string };
  try {
    created = await prisma.announcement.create({
      data: {
        titleEn: d.titleEn,
        titleAr: d.titleAr,
        bodyEn: d.bodyEn,
        bodyAr: d.bodyAr,
        imageUrl,
        targetRoles: d.targetRoles,
        targetBusinessLineIds: d.targetBusinessLineIds,
        startsAt: d.startsAt,
        endsAt: d.endsAt,
        isActive: d.isActive,
        pushNotificationSent: d.sendNotification,
        createdById: actor.id,
      },
      select: { id: true },
    });
  } catch (err) {
    logger.error({ err }, "announcement.create_failed");
    return { ok: false, message: "Could not create announcement." };
  }

  if (d.sendNotification) {
    await pushNotificationsToTargets({
      announcementId: created.id,
      titleEn: d.titleEn,
      titleAr: d.titleAr,
      targetRoles: d.targetRoles,
      targetBusinessLineIds: d.targetBusinessLineIds,
    });
  }

  revalidatePath("/admin/announcements");
  revalidatePath("/dashboard");
  redirect("/admin/announcements");
}

export async function updateAnnouncementAction(
  id: string,
  _prev: AnnouncementState | null,
  fd: FormData,
): Promise<AnnouncementState> {
  const actor = await requireActor();
  adminOnly(actor.role);

  const existing = await announcementRepository.findById(id);
  if (!existing) return { ok: false, message: "Announcement not found." };

  const parsed = Schema.safeParse(readFields(fd));
  if (!parsed.success) {
    return { ok: false, message: parsed.error.errors[0]?.message ?? "Invalid input" };
  }
  const d = parsed.data;

  let imageUrl: string | null = existing.imageUrl;
  const image = fd.get("image");
  if (image instanceof File && image.size > 0) {
    try {
      imageUrl = await uploadImage(image, "announcements/banner");
    } catch (err) {
      if (err instanceof ImageUploadError) {
        return { ok: false, message: err.message };
      }
      logger.error({ err, id }, "announcement.upload_failed");
      return { ok: false, message: "Image upload failed, please retry." };
    }
  }
  // Explicit "remove image" checkbox path.
  if (fd.get("clearImage") === "on") imageUrl = null;

  try {
    await prisma.announcement.update({
      where: { id },
      data: {
        titleEn: d.titleEn,
        titleAr: d.titleAr,
        bodyEn: d.bodyEn,
        bodyAr: d.bodyAr,
        imageUrl,
        targetRoles: d.targetRoles,
        targetBusinessLineIds: d.targetBusinessLineIds,
        startsAt: d.startsAt,
        endsAt: d.endsAt,
        isActive: d.isActive,
      },
    });
  } catch (err) {
    logger.error({ err, id }, "announcement.update_failed");
    return { ok: false, message: "Could not update announcement." };
  }

  // Only send a notification on update if requested AND we haven't already
  // sent one for this announcement.
  if (d.sendNotification && !existing.pushNotificationSent) {
    await pushNotificationsToTargets({
      announcementId: id,
      titleEn: d.titleEn,
      titleAr: d.titleAr,
      targetRoles: d.targetRoles,
      targetBusinessLineIds: d.targetBusinessLineIds,
    });
    await prisma.announcement.update({
      where: { id },
      data: { pushNotificationSent: true },
    });
  }

  revalidatePath("/admin/announcements");
  revalidatePath("/dashboard");
  redirect("/admin/announcements");
}

export async function deleteAnnouncementAction(fd: FormData): Promise<void> {
  const actor = await requireActor();
  adminOnly(actor.role);
  const id = fd.get("id")?.toString();
  if (!id) return;
  await announcementRepository.remove(id).catch(() => undefined);
  revalidatePath("/admin/announcements");
  revalidatePath("/dashboard");
}

export async function deleteAnnouncementSafeAction(id: string): Promise<SmartDeleteResult> {
  const actor = await requireActor();
  if (actor.role !== Role.ADMIN) return { ok: false, message: "Forbidden" };
  if (!id) return { ok: false, message: "Missing id" };
  const result = await smartDelete({
    label: "announcement",
    id,
    hard: () => prisma.announcement.delete({ where: { id } }),
    soft: () => prisma.announcement.update({ where: { id }, data: { isActive: false } }),
  });
  if (result.ok) {
    revalidatePath("/admin/announcements");
    revalidatePath("/dashboard");
  }
  return result;
}

export async function toggleAnnouncementAction(fd: FormData): Promise<void> {
  const actor = await requireActor();
  adminOnly(actor.role);
  const id = fd.get("id")?.toString();
  const isActive = fd.get("isActive")?.toString() === "true";
  if (!id) return;
  await prisma.announcement.update({ where: { id }, data: { isActive } }).catch(() => undefined);
  revalidatePath("/admin/announcements");
  revalidatePath("/dashboard");
}
