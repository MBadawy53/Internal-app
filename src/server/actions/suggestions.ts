"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { NotificationType, Role, SuggestionCategory, SuggestionStatus } from "@prisma/client";
import { requireActor } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { ImageUploadError, uploadImage } from "@/lib/upload/image";
import { notify } from "@/server/services/notify.service";
import { smartDelete, type SmartDeleteResult } from "@/server/lib/smart-delete";
import { suggestionRepository } from "@/server/repositories/suggestion.repository";

const MAX_PER_DAY = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

export type CreateSuggestionState =
  | { ok: true; id: string }
  | { ok: false; message?: string; fieldErrors?: Record<string, string> }
  | null;

const CreateSchema = z.object({
  title: z.string().trim().min(3).max(160),
  body: z.string().trim().min(10).max(4000),
  category: z.nativeEnum(SuggestionCategory),
});

export async function createSuggestionAction(
  _prev: CreateSuggestionState,
  fd: FormData,
): Promise<CreateSuggestionState> {
  const actor = await requireActor();

  // Per-user rate limit, enforced by counting recent submissions in the DB
  // (more durable than the in-memory rateLimit() helper for an authenticated
  // action — survives serverless instance restarts).
  const recent = await suggestionRepository.countRecentBySubmitter(actor.id, DAY_MS);
  if (recent >= MAX_PER_DAY) {
    return {
      ok: false,
      message: `You can submit up to ${MAX_PER_DAY} suggestions per day. Try again tomorrow.`,
    };
  }

  const parsed = CreateSchema.safeParse({
    title: fd.get("title")?.toString() ?? "",
    body: fd.get("body")?.toString() ?? "",
    category: fd.get("category")?.toString() || SuggestionCategory.IDEA,
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.errors) {
      const k = issue.path[0]?.toString();
      if (k && !fieldErrors[k]) fieldErrors[k] = issue.message;
    }
    return { ok: false, fieldErrors };
  }
  const d = parsed.data;

  let attachmentUrl: string | null = null;
  const image = fd.get("attachment");
  if (image instanceof File && image.size > 0) {
    try {
      attachmentUrl = await uploadImage(image, "suggestions");
    } catch (err) {
      if (err instanceof ImageUploadError) {
        return { ok: false, fieldErrors: { attachment: err.message } };
      }
      logger.error({ err }, "suggestion.upload_failed");
      return { ok: false, message: "Image upload failed, please retry." };
    }
  }

  try {
    const created = await suggestionRepository.create({
      title: d.title,
      body: d.body,
      category: d.category,
      attachmentUrl,
      submitter: { connect: { id: actor.id } },
    });
    revalidatePath("/suggestions");
    return { ok: true, id: created.id };
  } catch (err) {
    logger.error({ err }, "suggestion.create_failed");
    return { ok: false, message: "Could not submit. Please retry." };
  }
}

// ── Submitter edit (only while status = NEW) ───────────────────────────────

export type UpdateSuggestionState =
  | { ok: true }
  | { ok: false; message?: string; fieldErrors?: Record<string, string> }
  | null;

export async function updateSuggestionAction(
  id: string,
  _prev: UpdateSuggestionState,
  fd: FormData,
): Promise<UpdateSuggestionState> {
  const actor = await requireActor();
  if (!id) return { ok: false, message: "Missing id" };

  const existing = await prisma.suggestion.findUnique({
    where: { id },
    select: { submitterId: true, status: true },
  });
  if (!existing) return { ok: false, message: "Not found" };
  if (existing.submitterId !== actor.id) return { ok: false, message: "Forbidden" };
  if (existing.status !== SuggestionStatus.NEW) {
    return { ok: false, message: "This suggestion is locked — an admin is reviewing it." };
  }

  const parsed = CreateSchema.safeParse({
    title: fd.get("title")?.toString() ?? "",
    body: fd.get("body")?.toString() ?? "",
    category: fd.get("category")?.toString() || SuggestionCategory.IDEA,
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.errors) {
      const k = issue.path[0]?.toString();
      if (k && !fieldErrors[k]) fieldErrors[k] = issue.message;
    }
    return { ok: false, fieldErrors };
  }
  const d = parsed.data;

  try {
    await prisma.suggestion.update({
      where: { id },
      data: { title: d.title, body: d.body, category: d.category },
    });
    revalidatePath("/suggestions");
    revalidatePath(`/suggestions/${id}`);
    return { ok: true };
  } catch (err) {
    logger.error({ err, id }, "suggestion.update_failed");
    return { ok: false, message: "Could not save." };
  }
}

// ── Admin status / response update ─────────────────────────────────────────

export type UpdateStatusState = { ok: true } | { ok: false; message: string } | null;

const StatusSchema = z.object({
  status: z.nativeEnum(SuggestionStatus),
  adminResponse: z.string().max(4000).optional().or(z.literal("")),
});

export async function updateSuggestionStatusAction(
  id: string,
  _prev: UpdateStatusState,
  fd: FormData,
): Promise<UpdateStatusState> {
  const actor = await requireActor();
  if (actor.role !== Role.ADMIN) return { ok: false, message: "Forbidden" };
  if (!id) return { ok: false, message: "Missing id" };

  const parsed = StatusSchema.safeParse({
    status: fd.get("status")?.toString() ?? "",
    adminResponse: fd.get("adminResponse")?.toString() ?? "",
  });
  if (!parsed.success) return { ok: false, message: "Invalid input" };
  const d = parsed.data;

  const existing = await prisma.suggestion.findUnique({
    where: { id },
    select: { submitterId: true, status: true, adminResponse: true, title: true },
  });
  if (!existing) return { ok: false, message: "Not found" };

  const newResponse = d.adminResponse?.trim() || null;
  const responseChanged = newResponse !== existing.adminResponse;
  const statusChanged = d.status !== existing.status;
  if (!responseChanged && !statusChanged) return { ok: true };

  try {
    await prisma.suggestion.update({
      where: { id },
      data: {
        status: d.status,
        adminResponse: newResponse,
        adminResponseById: newResponse ? actor.id : null,
        adminResponseAt: newResponse ? new Date() : null,
      },
    });
  } catch (err) {
    logger.error({ err, id }, "suggestion.status_update_failed");
    return { ok: false, message: "Could not update." };
  }

  // Notify the submitter (skip if the admin IS the submitter).
  if (existing.submitterId !== actor.id) {
    await notify({
      userId: existing.submitterId,
      payload: {
        type: NotificationType.SUGGESTION_UPDATED,
        suggestionId: id,
        title: existing.title,
        status: d.status,
        adminResponseChanged: responseChanged,
      },
    });
  }

  revalidatePath("/suggestions");
  revalidatePath(`/suggestions/${id}`);
  return { ok: true };
}

// ── Admin delete (smart) ───────────────────────────────────────────────────

export async function deleteSuggestionSafeAction(id: string): Promise<SmartDeleteResult> {
  const actor = await requireActor();
  if (actor.role !== Role.ADMIN) return { ok: false, message: "Forbidden" };
  if (!id) return { ok: false, message: "Missing id" };
  const result = await smartDelete({
    label: "suggestion",
    id,
    // No isActive flag on Suggestion — admins always hard-delete.
    hard: () => prisma.suggestion.delete({ where: { id } }),
  });
  if (result.ok) revalidatePath("/suggestions");
  return result;
}

// ── Submitter delete-own (only while NEW) ──────────────────────────────────

export async function deleteOwnSuggestionAction(id: string): Promise<SmartDeleteResult> {
  const actor = await requireActor();
  if (!id) return { ok: false, message: "Missing id" };
  const existing = await prisma.suggestion.findUnique({
    where: { id },
    select: { submitterId: true, status: true },
  });
  if (!existing) return { ok: false, message: "Not found" };
  if (existing.submitterId !== actor.id) return { ok: false, message: "Forbidden" };
  if (existing.status !== SuggestionStatus.NEW) {
    return {
      ok: false,
      message: "An admin is already reviewing this — you can't delete it now.",
    };
  }
  try {
    await prisma.suggestion.delete({ where: { id } });
    revalidatePath("/suggestions");
    return { ok: true, mode: "hard" };
  } catch (err) {
    logger.error({ err, id }, "suggestion.delete_own_failed");
    return { ok: false, message: "Could not delete." };
  }
}

// ── Redirect helper used after create ──────────────────────────────────────

export async function createSuggestionAndRedirectAction(
  prev: CreateSuggestionState,
  fd: FormData,
): Promise<CreateSuggestionState> {
  const result = await createSuggestionAction(prev, fd);
  if (result?.ok) {
    redirect(`/suggestions/${result.id}`);
  }
  return result;
}
