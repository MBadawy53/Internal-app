"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  LeadAppStatus,
  LeadProductStatus,
  LeadSource,
  LeadActivityType,
  LeadTrack,
  NotificationType,
  Role,
} from "@prisma/client";
import { requireActor } from "@/lib/auth/session";
import { requirePermission } from "@/lib/auth/permissions";
import { encryptOptional } from "@/lib/crypto/aes-gcm";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { leadRepository } from "@/server/repositories/lead.repository";
import { leadService } from "@/server/services/lead.service";
import { notify } from "@/server/services/notify.service";
import { canTransitionState, needsReasonForState, type LeadState } from "@/lib/leads/state-machine";
import { egpToPiastres } from "@/lib/finance/money";
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
  // Claimable if unassigned, or still in early credit-assessment phase.
  const claimable =
    lead.ownerEmployeeId === null ||
    lead.appStatus === LeadAppStatus.INCOMPLETE ||
    lead.appStatus === LeadAppStatus.CREDIT_RISK;
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

// ── New two-dimensional status transition (Auto Loans alignment) ───────────

const TransitionStateSchema = z.object({
  leadId: z.string().min(1),
  toAppStatus: z.nativeEnum(LeadAppStatus),
  toProductStatus: z.nativeEnum(LeadProductStatus),
  toTrack: z.nativeEnum(LeadTrack).optional().or(z.literal("")),
  reason: z.string().max(500).optional().or(z.literal("")),
  note: z.string().max(1000).optional().or(z.literal("")),
  // Required only when transitioning into CONTRACT. The form sends the EGP
  // value (decimal string); we convert to piastres here.
  finalLoanAmountEgp: z.string().optional().or(z.literal("")),
});

export type TransitionStateState = { ok: true } | { ok: false; message: string };

export async function transitionLeadStateAction(
  _prev: TransitionStateState | null,
  fd: FormData,
): Promise<TransitionStateState> {
  const actor = await requireActor();
  requirePermission(actor, "update", "lead");

  const parsed = TransitionStateSchema.safeParse({
    leadId: fd.get("leadId")?.toString(),
    toAppStatus: fd.get("toAppStatus")?.toString(),
    toProductStatus: fd.get("toProductStatus")?.toString(),
    toTrack: fd.get("toTrack")?.toString() ?? "",
    reason: fd.get("reason")?.toString() ?? "",
    note: fd.get("note")?.toString() ?? "",
    finalLoanAmountEgp: fd.get("finalLoanAmountEgp")?.toString() ?? "",
  });
  if (!parsed.success) return { ok: false, message: "Invalid input" };
  const d = parsed.data;

  const lead = await leadService.get(actor, d.leadId);
  if (!lead) return { ok: false, message: "Lead not found" };

  const from: LeadState = { appStatus: lead.appStatus, productStatus: lead.productStatus };
  const to: LeadState = { appStatus: d.toAppStatus, productStatus: d.toProductStatus };
  if (!canTransitionState(from, to)) {
    return {
      ok: false,
      message: `Illegal transition: ${from.appStatus}/${from.productStatus} → ${to.appStatus}/${to.productStatus}`,
    };
  }
  if (needsReasonForState(to) && !d.reason?.trim()) {
    return { ok: false, message: "A reason is required for this status." };
  }

  // CONTRACT is the terminal closed state — the lead's final loan amount must
  // be captured here so commission can be computed. We accept either a fresh
  // input (preferred) or fall back to the value already on the lead (e.g. an
  // admin correction without restating the figure).
  let finalLoanAmountPiastres: bigint | null = lead.finalLoanAmountPiastres ?? null;
  if (d.toProductStatus === LeadProductStatus.CONTRACT) {
    if (d.finalLoanAmountEgp && d.finalLoanAmountEgp.trim()) {
      try {
        finalLoanAmountPiastres = egpToPiastres(d.finalLoanAmountEgp.trim());
      } catch {
        return { ok: false, message: "Invalid final loan amount." };
      }
    }
    if (!finalLoanAmountPiastres || finalLoanAmountPiastres <= 0n) {
      return { ok: false, message: "Final loan amount is required to close the contract." };
    }
  }

  const nextTrack: LeadTrack | null = d.toTrack ? (d.toTrack as LeadTrack) : (lead.track ?? null);

  try {
    await prisma.$transaction([
      prisma.lead.update({
        where: { id: lead.id },
        data: {
          appStatus: d.toAppStatus,
          productStatus: d.toProductStatus,
          track: nextTrack,
          finalLoanAmountPiastres,
        },
      }),
      prisma.leadStatusHistory.create({
        data: {
          leadId: lead.id,
          fromAppStatus: lead.appStatus,
          toAppStatus: d.toAppStatus,
          fromProductStatus: lead.productStatus,
          toProductStatus: d.toProductStatus,
          fromTrack: lead.track ?? null,
          toTrack: nextTrack ?? null,
          reason: d.reason || null,
          note: d.note || null,
          actorId: actor.id,
        },
      }),
      prisma.leadActivity.create({
        data: {
          leadId: lead.id,
          type: LeadActivityType.STATUS_CHANGE,
          content: `${from.appStatus}/${from.productStatus} → ${to.appStatus}/${to.productStatus}`,
          actorId: actor.id,
        },
      }),
    ]);

    const payload = {
      type: NotificationType.LEAD_STATUS_CHANGED,
      leadId: lead.id,
      customerName: lead.customerName,
      fromStatus: `${from.appStatus}/${from.productStatus}`,
      toStatus: `${to.appStatus}/${to.productStatus}`,
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
    logger.error({ err, leadId: lead.id }, "lead.state_transition_failed");
    return { ok: false, message: "Status update failed" };
  }
}

// ── Update product (and business line) on a submitted lead ─────────────────

const UpdateLeadProductSchema = z.object({
  leadId: z.string().min(1),
  businessLineId: z.string().min(1),
  productId: z.string().optional().or(z.literal("")),
});

export type UpdateLeadProductState = { ok: true } | { ok: false; message: string };

export async function updateLeadProductAction(
  _prev: UpdateLeadProductState | null,
  fd: FormData,
): Promise<UpdateLeadProductState> {
  const actor = await requireActor();
  requirePermission(actor, "update", "lead");

  const parsed = UpdateLeadProductSchema.safeParse({
    leadId: fd.get("leadId")?.toString(),
    businessLineId: fd.get("businessLineId")?.toString(),
    productId: fd.get("productId")?.toString() ?? "",
  });
  if (!parsed.success) return { ok: false, message: "Invalid input" };
  const d = parsed.data;

  const lead = await leadService.get(actor, d.leadId);
  if (!lead) return { ok: false, message: "Lead not found" };

  const newProductId = d.productId || null;
  if (newProductId) {
    const product = await prisma.product.findUnique({
      where: { id: newProductId },
      select: { id: true, businessLineId: true, isActive: true, nameEn: true, nameAr: true },
    });
    if (!product || !product.isActive) {
      return { ok: false, message: "Product not found" };
    }
    if (product.businessLineId !== d.businessLineId) {
      return { ok: false, message: "Product does not belong to the selected business line." };
    }
  }

  const blChanged = lead.businessLineId !== d.businessLineId;
  const productChanged = (lead.productId ?? null) !== newProductId;
  if (!blChanged && !productChanged) return { ok: true };

  // Build a human note describing what changed. Names are looked up only when
  // we actually need them, so a no-op save doesn't run extra queries.
  const [newBl, oldProduct, newProduct] = await Promise.all([
    blChanged
      ? prisma.businessLine.findUnique({
          where: { id: d.businessLineId },
          select: { nameEn: true },
        })
      : Promise.resolve(null),
    productChanged && lead.productId
      ? prisma.product.findUnique({
          where: { id: lead.productId },
          select: { nameEn: true },
        })
      : Promise.resolve(null),
    productChanged && newProductId
      ? prisma.product.findUnique({
          where: { id: newProductId },
          select: { nameEn: true },
        })
      : Promise.resolve(null),
  ]);
  if (blChanged && !newBl) {
    return { ok: false, message: "Business line not found" };
  }

  const parts: string[] = [];
  if (blChanged) {
    parts.push(
      `Business line → ${newBl?.nameEn ?? d.businessLineId}` +
        (lead.businessLine ? ` (was ${lead.businessLine.nameEn})` : ""),
    );
  }
  if (productChanged) {
    parts.push(
      `Product → ${newProduct?.nameEn ?? "—"}` +
        (oldProduct ? ` (was ${oldProduct.nameEn})` : lead.productId ? "" : " (was —)"),
    );
  }
  const note = parts.join("; ");

  try {
    await prisma.$transaction([
      prisma.lead.update({
        where: { id: lead.id },
        data: { businessLineId: d.businessLineId, productId: newProductId },
      }),
      prisma.leadActivity.create({
        data: {
          leadId: lead.id,
          type: LeadActivityType.NOTE,
          content: note,
          actorId: actor.id,
        },
      }),
    ]);
    revalidatePath(`/leads/${lead.id}`);
    revalidatePath("/leads");
    return { ok: true };
  } catch (err) {
    logger.error({ err, leadId: lead.id }, "lead.update_product_failed");
    return { ok: false, message: "Could not update product" };
  }
}
