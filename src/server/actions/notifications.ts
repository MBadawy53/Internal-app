"use server";

import { revalidatePath } from "next/cache";
import { requireActor } from "@/lib/auth/session";
import { notificationRepository } from "@/server/repositories/notification.repository";

export async function markNotificationReadAction(formData: FormData): Promise<void> {
  const actor = await requireActor();
  const id = formData.get("id")?.toString();
  if (!id) return;
  await notificationRepository.markRead(id, actor.id);
  revalidatePath("/notifications");
}

export async function markAllNotificationsReadAction(): Promise<void> {
  const actor = await requireActor();
  await notificationRepository.markAllRead(actor.id);
  revalidatePath("/notifications");
}
