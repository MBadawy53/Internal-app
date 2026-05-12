"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { LeadActivityType, LeadSource, LeadStatus, NotificationType, Role } from "@prisma/client";
import { requireActor } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { encryptOptional } from "@/lib/crypto/aes-gcm";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";
import { qrCampaignRepository } from "@/server/repositories/qrCampaign.repository";
import { leadRepository } from "@/server/repositories/lead.repository";
import { makeCampaignSlug } from "@/lib/qr/slug";

export type CreateCampaignState = { ok: true; slug: string } | { ok: false; message: string };

const CreateCampaignSchema = z.object({
  name: z.string().min(2).max(120),
  employeeId: z.string().min(1),
  productId: z.string().optional().or(z.literal("")),
  headerImageUrl: z.string().url().max(500).optional().or(z.literal("")),
  titleEn: z.string().max(120).optional().or(z.literal("")),
  titleAr: z.string().max(120).optional().or(z.literal("")),
  subtitleEn: z.string().max(240).optional().or(z.literal("")),
  subtitleAr: z.string().max(240).optional().or(z.literal("")),
  bodyMdEn: z.string().max(5000).optional().or(z.literal("")),
  bodyMdAr: z.string().max(5000).optional().or(z.literal("")),
});

function readLandingFields(fd: FormData) {
  return {
    headerImageUrl: fd.get("headerImageUrl")?.toString().trim() ?? "",
    titleEn: fd.get("titleEn")?.toString().trim() ?? "",
    titleAr: fd.get("titleAr")?.toString().trim() ?? "",
    subtitleEn: fd.get("subtitleEn")?.toString().trim() ?? "",
    subtitleAr: fd.get("subtitleAr")?.toString().trim() ?? "",
    bodyMdEn: fd.get("bodyMdEn")?.toString() ?? "",
    bodyMdAr: fd.get("bodyMdAr")?.toString() ?? "",
  };
}

function nullIfEmpty(v: string): string | null {
  return v.trim() === "" ? null : v;
}

/**
 * Admin / BL owner action: create a QR campaign on behalf of an employee.
 * Plain employees do not have create rights in the UI; the action also
 * re-checks role server-side.
 */
export async function createCampaignAction(
  _prev: CreateCampaignState | null,
  fd: FormData,
): Promise<CreateCampaignState> {
  const actor = await requireActor();
  if (actor.role !== Role.ADMIN && actor.role !== Role.BUSINESS_LINE_OWNER) {
    return { ok: false, message: "Only admins or business line owners can create campaigns." };
  }

  const parsed = CreateCampaignSchema.safeParse({
    name: fd.get("name")?.toString().trim() ?? "",
    employeeId: fd.get("employeeId")?.toString() ?? "",
    productId: fd.get("productId")?.toString() ?? "",
    ...readLandingFields(fd),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.errors[0]?.message ?? "Invalid input" };
  }
  const d = parsed.data;

  // Slug must be unique; retry on the (vanishingly rare) collision.
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = makeCampaignSlug();
    try {
      const created = await qrCampaignRepository.create({
        name: d.name,
        slug,
        employee: { connect: { id: d.employeeId } },
        ...(d.productId ? { product: { connect: { id: d.productId } } } : {}),
        headerImageUrl: nullIfEmpty(d.headerImageUrl ?? ""),
        titleEn: nullIfEmpty(d.titleEn ?? ""),
        titleAr: nullIfEmpty(d.titleAr ?? ""),
        subtitleEn: nullIfEmpty(d.subtitleEn ?? ""),
        subtitleAr: nullIfEmpty(d.subtitleAr ?? ""),
        bodyMdEn: nullIfEmpty(d.bodyMdEn ?? ""),
        bodyMdAr: nullIfEmpty(d.bodyMdAr ?? ""),
      });
      revalidatePath("/qr");
      return { ok: true, slug: created.slug };
    } catch (err) {
      const msg = (err as Error).message ?? "";
      if (msg.includes("Unique constraint")) continue;
      logger.error({ err }, "qr.create_failed");
      return { ok: false, message: "Could not create campaign" };
    }
  }
  return { ok: false, message: "Could not allocate a unique slug; please retry." };
}

// ── Update ─────────────────────────────────────────────────────────────────

export type UpdateCampaignState = { ok: true } | { ok: false; message: string };

const UpdateCampaignSchema = CreateCampaignSchema.omit({ employeeId: true });

/**
 * Update an existing campaign's name + landing content. Employee owner can't
 * be reassigned here (we'd lose attribution); change requires creating a new
 * campaign.
 */
export async function updateCampaignAction(
  id: string,
  _prev: UpdateCampaignState | null,
  fd: FormData,
): Promise<UpdateCampaignState> {
  const actor = await requireActor();
  if (actor.role !== Role.ADMIN && actor.role !== Role.BUSINESS_LINE_OWNER) {
    return { ok: false, message: "Forbidden" };
  }
  const parsed = UpdateCampaignSchema.safeParse({
    name: fd.get("name")?.toString().trim() ?? "",
    productId: fd.get("productId")?.toString() ?? "",
    ...readLandingFields(fd),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.errors[0]?.message ?? "Invalid input" };
  }
  const d = parsed.data;
  try {
    await prisma.qrCampaign.update({
      where: { id },
      data: {
        name: d.name,
        ...(d.productId
          ? { product: { connect: { id: d.productId } } }
          : { product: { disconnect: true } }),
        headerImageUrl: nullIfEmpty(d.headerImageUrl ?? ""),
        titleEn: nullIfEmpty(d.titleEn ?? ""),
        titleAr: nullIfEmpty(d.titleAr ?? ""),
        subtitleEn: nullIfEmpty(d.subtitleEn ?? ""),
        subtitleAr: nullIfEmpty(d.subtitleAr ?? ""),
        bodyMdEn: nullIfEmpty(d.bodyMdEn ?? ""),
        bodyMdAr: nullIfEmpty(d.bodyMdAr ?? ""),
      },
    });
    revalidatePath("/qr");
    revalidatePath(`/qr/${id}/edit`);
    return { ok: true };
  } catch (err) {
    logger.error({ err, id }, "qr.update_failed");
    return { ok: false, message: "Update failed" };
  }
}

export type ToggleCampaignState = { ok: true } | { ok: false; message: string };

export async function setCampaignActiveAction(
  _prev: ToggleCampaignState | null,
  fd: FormData,
): Promise<ToggleCampaignState> {
  const actor = await requireActor();
  if (actor.role !== Role.ADMIN && actor.role !== Role.BUSINESS_LINE_OWNER) {
    return { ok: false, message: "Forbidden" };
  }
  const id = fd.get("id")?.toString();
  const isActive = fd.get("isActive")?.toString() === "true";
  if (!id) return { ok: false, message: "Missing id" };
  try {
    await qrCampaignRepository.setActive(id, isActive);
    revalidatePath("/qr");
    return { ok: true };
  } catch (err) {
    logger.error({ err, id }, "qr.toggle_failed");
    return { ok: false, message: "Update failed" };
  }
}

// ── Public ─────────────────────────────────────────────────────────────────

export type PublicLeadState = { ok: true } | { ok: false; message: string };

const PublicLeadSchema = z.object({
  code: z.string().min(2).max(40),
  customerName: z.string().min(1).max(160),
  customerPhone: z.string().min(6).max(32),
  customerEmail: z.string().email().max(160).optional().or(z.literal("")),
  preferredContactTime: z.string().max(120).optional().or(z.literal("")),
  customerNote: z.string().max(1000).optional().or(z.literal("")),
  company: z.string().optional(), // honeypot
  consentGiven: z.coerce.boolean().refine((v) => v === true, "Consent required"),
});

/**
 * Public landing submission. No auth required. Validates the honeypot, rate
 * limits per IP, resolves the code against campaign slug then user referral
 * code, creates a lead, bumps the campaign counter, and notifies the owning
 * employee.
 */
export async function submitPublicLeadAction(
  _prev: PublicLeadState | null,
  fd: FormData,
): Promise<PublicLeadState> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "unknown";
  const userAgent = h.get("user-agent") ?? undefined;

  // Per-IP rate limit: 5 submissions / hour.
  if (!rateLimit(`public-lead:${ip}`, 5, 60 * 60 * 1000)) {
    return { ok: false, message: "Too many requests, please try again later." };
  }

  const parsed = PublicLeadSchema.safeParse({
    code: fd.get("code")?.toString() ?? "",
    customerName: fd.get("customerName")?.toString().trim() ?? "",
    customerPhone: fd.get("customerPhone")?.toString().trim() ?? "",
    customerEmail: fd.get("customerEmail")?.toString().trim() ?? "",
    preferredContactTime: fd.get("preferredContactTime")?.toString() ?? "",
    customerNote: fd.get("customerNote")?.toString() ?? "",
    company: fd.get("company")?.toString() ?? "",
    consentGiven: fd.get("consentGiven") === "on" || fd.get("consentGiven") === "true",
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.errors[0]?.message ?? "Invalid input" };
  }
  const d = parsed.data;

  // Honeypot: if filled, silently pretend success so bots don't learn.
  if (d.company && d.company.trim() !== "") {
    logger.warn({ ip, code: d.code }, "qr.public_lead.honeypot");
    return { ok: true };
  }

  // Resolve code: campaign slug first, then user referral code.
  const campaign = await qrCampaignRepository.findActiveBySlug(d.code);
  let ownerEmployeeId: string | null = null;
  let businessLineId: string | null = null;
  let productId: string | null = null;
  let campaignId: string | null = null;
  if (campaign) {
    ownerEmployeeId = campaign.employee.id;
    businessLineId = campaign.product?.businessLineId ?? campaign.employee.businessLineId ?? null;
    productId = campaign.product?.id ?? null;
    campaignId = campaign.id;
  } else {
    const employee = await prisma.user.findUnique({
      where: { referralCode: d.code },
      select: { id: true, businessLineId: true, isActive: true },
    });
    if (!employee || !employee.isActive) {
      return { ok: false, message: "Invalid referral code" };
    }
    ownerEmployeeId = employee.id;
    businessLineId = employee.businessLineId;
  }

  if (!businessLineId) {
    logger.error({ code: d.code }, "qr.public_lead.no_business_line");
    return { ok: false, message: "Could not route this enquiry." };
  }

  try {
    const lead = await leadRepository.create({
      customerName: d.customerName,
      customerPhone: d.customerPhone,
      customerEmailEnc: encryptOptional(d.customerEmail || undefined),
      source: LeadSource.QR_CODE,
      preferredContactTime: d.preferredContactTime || null,
      customerNote: d.customerNote || null,
      consentGivenAt: new Date(),
      consentIp: ip === "unknown" ? null : ip,
      consentUserAgent: userAgent ?? null,
      currentStatus: LeadStatus.NEW,
      businessLine: { connect: { id: businessLineId } },
      owner: { connect: { id: ownerEmployeeId! } },
      referredBy: { connect: { id: ownerEmployeeId! } },
      ...(productId ? { product: { connect: { id: productId } } } : {}),
      ...(campaignId ? { campaign: { connect: { id: campaignId } } } : {}),
    });

    // Bump campaign lead count (if this was a campaign hit).
    if (campaignId) {
      await qrCampaignRepository.incrementLeadCount(campaignId).catch(() => undefined);
    }

    // Auto-add a NOTE activity so the timeline shows where the lead came in.
    await prisma.leadActivity
      .create({
        data: {
          leadId: lead.id,
          type: LeadActivityType.NOTE,
          content: campaignId
            ? `Submitted via QR campaign (${d.code})`
            : `Submitted via referral link (${d.code})`,
          actorId: ownerEmployeeId!,
        },
      })
      .catch(() => undefined);

    // Notify the owning employee. In-app for now; channels in Phase 5.
    await prisma.notification
      .create({
        data: {
          userId: ownerEmployeeId!,
          type: NotificationType.NEW_LEAD_FROM_QR,
          payloadJson: {
            leadId: lead.id,
            customerName: d.customerName,
            customerPhone: d.customerPhone,
            campaignSlug: campaign?.slug ?? null,
          },
        },
      })
      .catch(() => undefined);

    revalidatePath("/leads");
    return { ok: true };
  } catch (err) {
    logger.error({ err }, "qr.public_lead.create_failed");
    return { ok: false, message: "Could not submit, please retry." };
  }
}
