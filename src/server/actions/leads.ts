"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { LeadStatus, LeadSource, LeadActivityType, NotificationType, Role } from "@prisma/client";
import { requireActor } from "@/lib/auth/session";
import { requirePermission } from "@/lib/auth/permissions";
import { encryptOptional } from "@/lib/crypto/aes-gcm";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { leadRepository } from "@/server/repositories/lead.repository";
import { leadService } from "@/server/services/lead.service";
import { notify } from "@/server/services/notify.service";
import { canTransition, needsReason } from "@/lib/leads/state-machine";
import { smartDelete, type SmartDeleteResult } from "@/server/lib/smart-delete";
import { buildCustomFieldsFromForm, readFields } from "@/lib/leadForm/types";

const CreateLeadSchema = z.object({
  customerName: z.string().min(1).max(160),
  customerPhone: z.string().min(6).max(32),
  customerEmail: z.string().email().max(160).optional().or(z.literal("")),
  nationalId: z.string().max(20).optional().or(z.literal("")),
  businessLineId: z.string().min(1),
  productId: z.string().optional().or(z.literal("")),
  ownerEmployeeId: z.string().optional().or(z.literal("")),
  preferredContactTime: z.string().max(120).optional().or(z.literal("")),
  customerNote: z.string().max(2000).optional().or(z.literal("")),
  consentGiven: z.coerce.boolean().refine((v) => v === true, "Consent is required"),
});

export type CreateLeadState = { ok: true; id: string } | { ok: false; message: string };

function fromCreateFormData(fd: FormData) {
  return {
    customerName: fd.get("customerName")?.toString().trim() ?? "",
    customerPhone: fd.get("customerPhone")?.toString().trim() ?? "",
    customerEmail: fd.get("customerEmail")?.toString().trim() ?? "",
    nationalId: fd.get("nationalId")?.toString().trim() ?? "",
    businessLineId: fd.get("businessLineId")?.toString() ?? "",
    productId: fd.get("productId")?.toString() ?? "",
    ownerEmployeeId: fd.get("ownerEmployeeId")?.toString() ?? "",
    preferredContactTime: fd.get("preferredContactTime")?.toString() ?? "",
    customerNote: fd.get("customerNote")?.toString() ?? "",
    consentGiven: fd.get("consentGiven") === "on" || fd.get("consentGiven") === "true",
  };
}

export async function createLeadAction(
  _prev: CreateLeadState | null,
  fd: FormData,
): Promise<CreateLeadState> {
  const actor = await requireActor();
  requirePermission(actor, "create", "lead");

  const parsed = CreateLeadSchema.safeParse(fromCreateFormData(fd));
  if (!parsed.success) {
    return { ok: false, message: parsed.error.errors[0]?.message ?? "Invalid input" };
  }
  const d = parsed.data;

  // Determine the owner. Employees creating manually become the owner unless
  // a different one is picked. Admins / BL owners must pick.
  const ownerId = d.ownerEmployeeId || (actor.role === Role.EMPLOYEE ? actor.id : "");
  if (!ownerId) {
    return { ok: false, message: "Owner is required" };
  }

  // Resolve custom fields. The form posts the originating campaign id as a
  // hint; we re-fetch the campaign server-side and validate answers against
  // its schema so a tampered client can't swap the field definitions.
  const cfCampaignId = fd.get("customFieldsCampaignId")?.toString() || null;
  let customFields: Record<string, string | number | boolean> | null = null;
  let snapshotCampaignId: string | null = null;
  if (cfCampaignId) {
    const campaign = await prisma.qrCampaign.findUnique({
      where: { id: cfCampaignId },
      select: { id: true, isActive: true, customFields: true },
    });
    const fields = campaign && campaign.isActive ? readFields(campaign.customFields) : [];
    if (campaign && fields.length > 0) {
      const result = buildCustomFieldsFromForm(fields, fd);
      if (!result.ok) return { ok: false, message: result.message };
      customFields = result.values;
      snapshotCampaignId = campaign.id;
    }
  }

  try {
    const lead = await leadRepository.create({
      customerName: d.customerName,
      customerPhone: d.customerPhone,
      customerEmailEnc: encryptOptional(d.customerEmail),
      nationalIdEnc: encryptOptional(d.nationalId),
      source: LeadSource.MANUAL_ENTRY,
      preferredContactTime: d.preferredContactTime || null,
      customerNote: d.customerNote || null,
      consentGivenAt: new Date(),
      currentStatus: LeadStatus.NEW,
      businessLine: { connect: { id: d.businessLineId } },
      owner: { connect: { id: ownerId } },
      referredBy: { connect: { id: actor.id } },
      ...(d.productId ? { product: { connect: { id: d.productId } } } : {}),
      // Snapshot the campaign so the lead detail page can render answers
      // with their (current) labels — not because the lead "came from" a
      // QR campaign (source stays MANUAL_ENTRY).
      ...(snapshotCampaignId ? { campaign: { connect: { id: snapshotCampaignId } } } : {}),
      ...(customFields ? { customFields } : {}),
    });

    // Notify the owner (unless they're the actor — no point pinging yourself).
    if (ownerId !== actor.id) {
      await notify({
        userId: ownerId,
        payload: {
          type: NotificationType.NEW_LEAD_MANUAL,
          leadId: lead.id,
          customerName: d.customerName,
          customerPhone: d.customerPhone,
          createdById: actor.id,
        },
      });
    }

    revalidatePath("/leads");
    redirect(`/leads/${lead.id}`);
    return { ok: true, id: lead.id };
  } catch (err) {
    logger.error({ err }, "lead.create_failed");
    throw err;
  }
}

const TransitionSchema = z.object({
  leadId: z.string().min(1),
  toStatus: z.nativeEnum(LeadStatus),
  reason: z.string().max(500).optional().or(z.literal("")),
  note: z.string().max(1000).optional().or(z.literal("")),
});

export type TransitionState = { ok: true } | { ok: false; message: string };

export async function transitionLeadStatusAction(
  _prev: TransitionState | null,
  fd: FormData,
): Promise<TransitionState> {
  const actor = await requireActor();
  requirePermission(actor, "update", "lead");

  const parsed = TransitionSchema.safeParse({
    leadId: fd.get("leadId")?.toString(),
    toStatus: fd.get("toStatus")?.toString(),
    reason: fd.get("reason")?.toString() ?? "",
    note: fd.get("note")?.toString() ?? "",
  });
  if (!parsed.success) return { ok: false, message: "Invalid input" };
  const d = parsed.data;

  // Re-load lead through the service so scope is enforced.
  const lead = await leadService.get(actor, d.leadId);
  if (!lead) return { ok: false, message: "Lead not found" };

  if (!canTransition(lead.currentStatus, d.toStatus)) {
    return {
      ok: false,
      message: `Illegal transition: ${lead.currentStatus} → ${d.toStatus}`,
    };
  }
  if (needsReason(d.toStatus) && !d.reason?.trim()) {
    return { ok: false, message: "A reason is required for this status." };
  }

  try {
    await leadRepository.transition({
      leadId: lead.id,
      fromStatus: lead.currentStatus,
      toStatus: d.toStatus,
      reason: d.reason || null,
      note: d.note || null,
      actorId: actor.id,
    });

    // Notify the lead's owner (and referrer if different) — but never the
    // actor who just made the change.
    const payload = {
      type: NotificationType.LEAD_STATUS_CHANGED,
      leadId: lead.id,
      customerName: lead.customerName,
      fromStatus: lead.currentStatus,
      toStatus: d.toStatus,
      reason: d.reason ?? null,
      actorId: actor.id,
    } as const;
    const recipients = new Set<string>();
    if (lead.ownerEmployeeId && lead.ownerEmployeeId !== actor.id) {
      recipients.add(lead.ownerEmployeeId);
    }
    if (lead.referredByEmployeeId && lead.referredByEmployeeId !== actor.id) {
      recipients.add(lead.referredByEmployeeId);
    }
    for (const userId of recipients) {
      await notify({ userId, payload });
    }

    revalidatePath(`/leads/${lead.id}`);
    revalidatePath("/leads");
    return { ok: true };
  } catch (err) {
    logger.error({ err, leadId: lead.id }, "lead.transition_failed");
    return { ok: false, message: "Status update failed" };
  }
}

const AddActivitySchema = z.object({
  leadId: z.string().min(1),
  type: z.nativeEnum(LeadActivityType),
  content: z.string().min(1).max(2000),
});

export type AddActivityState = { ok: true } | { ok: false; message: string };

export async function addLeadActivityAction(
  _prev: AddActivityState | null,
  fd: FormData,
): Promise<AddActivityState> {
  const actor = await requireActor();
  requirePermission(actor, "update", "lead");

  const parsed = AddActivitySchema.safeParse({
    leadId: fd.get("leadId")?.toString(),
    type: fd.get("type")?.toString(),
    content: fd.get("content")?.toString(),
  });
  if (!parsed.success) return { ok: false, message: "Invalid input" };
  const d = parsed.data;

  const lead = await leadService.get(actor, d.leadId);
  if (!lead) return { ok: false, message: "Lead not found" };

  // STATUS_CHANGE is auto-written by transitions; block manual injection.
  if (d.type === LeadActivityType.STATUS_CHANGE) {
    return { ok: false, message: "Cannot manually add STATUS_CHANGE activity" };
  }

  try {
    await leadRepository.addActivity({
      leadId: lead.id,
      type: d.type,
      content: d.content.trim(),
      actorId: actor.id,
    });
    revalidatePath(`/leads/${lead.id}`);
    return { ok: true };
  } catch (err) {
    logger.error({ err, leadId: lead.id }, "lead.add_activity_failed");
    return { ok: false, message: "Could not add activity" };
  }
}

// ── Claim (self-assign) ───────────────────────────────────────────────────

export type ClaimLeadState = { ok: true } | { ok: false; message: string };

/**
 * Self-assign a lead. Allowed when the lead has no owner OR its current
 * status is still NEW (prevents 'stealing' an in-progress lead). Owner-only
 * update — status is left untouched. Notifies the previous owner if there
 * was one (and it wasn't the actor).
 */
export async function claimLeadAction(
  _prev: ClaimLeadState | null,
  fd: FormData,
): Promise<ClaimLeadState> {
  const actor = await requireActor();
  requirePermission(actor, "update", "lead");

  const leadId = fd.get("leadId")?.toString();
  if (!leadId) return { ok: false, message: "Missing lead id" };

  const lead = await leadService.get(actor, leadId);
  if (!lead) return { ok: false, message: "Lead not found" };

  if (lead.ownerEmployeeId === actor.id) {
    return { ok: true }; // already owned by actor, no-op
  }
  const claimable = lead.ownerEmployeeId === null || lead.currentStatus === LeadStatus.NEW;
  if (!claimable) {
    return {
      ok: false,
      message: "This lead is already owned and past the NEW stage.",
    };
  }

  const previousOwnerId = lead.ownerEmployeeId;

  try {
    await prisma.lead.update({
      where: { id: lead.id },
      data: { ownerEmployeeId: actor.id },
    });

    await prisma.leadActivity
      .create({
        data: {
          leadId: lead.id,
          type: LeadActivityType.NOTE,
          content: previousOwnerId ? "Claimed (took over)" : "Claimed (unassigned)",
          actorId: actor.id,
        },
      })
      .catch(() => undefined);

    if (previousOwnerId && previousOwnerId !== actor.id) {
      await notify({
        userId: previousOwnerId,
        payload: {
          type: NotificationType.LEAD_ASSIGNED,
          leadId: lead.id,
          customerName: lead.customerName,
          newOwnerId: actor.id,
          previousOwnerId,
        },
      });
    }

    revalidatePath(`/leads/${lead.id}`);
    revalidatePath("/leads");
    return { ok: true };
  } catch (err) {
    logger.error({ err, leadId: lead.id }, "lead.claim_failed");
    return { ok: false, message: "Could not claim the lead" };
  }
}

/**
 * Admin-only hard delete. Leads carry audit history (LeadStatusHistory,
 * LeadActivity) which cascades on delete, plus Quote rows which DON'T cascade
 * — so a lead with quotes can't be hard-deleted. There's no isActive on Lead;
 * we don't soft-delete, we just refuse if FKs block the delete.
 */
export async function deleteLeadAction(id: string): Promise<SmartDeleteResult> {
  const actor = await requireActor();
  if (actor.role !== Role.ADMIN) return { ok: false, message: "Forbidden" };
  if (!id) return { ok: false, message: "Missing id" };
  const result = await smartDelete({
    label: "lead",
    id,
    hard: () => prisma.lead.delete({ where: { id } }),
    // No soft-delete equivalent for leads. Leaving this off causes smartDelete
    // to surface "This item is referenced elsewhere…" when FKs block.
  });
  if (result.ok) {
    revalidatePath("/leads");
  }
  return result;
}
