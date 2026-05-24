"use server";

import { z } from "zod";
import * as argon2 from "argon2";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import {
  LeadActivityType,
  LeadSource,
  LeadStatus,
  NotificationType,
  QrCampaignKind,
  Role,
} from "@prisma/client";
import { signIn } from "@/lib/auth/config";
import { requireActor } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { encryptOptional } from "@/lib/crypto/aes-gcm";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";
import { qrCampaignRepository } from "@/server/repositories/qrCampaign.repository";
import { leadRepository } from "@/server/repositories/lead.repository";
import { notify } from "@/server/services/notify.service";
import {
  buildCustomFieldsFromForm,
  leadFormFieldsSchema,
  readFields,
  type LeadFormField,
} from "@/lib/leadForm/types";
import { makeCampaignSlug } from "@/lib/qr/slug";
import { smartDelete, type SmartDeleteResult } from "@/server/lib/smart-delete";

export type CreateCampaignState = { ok: true; slug: string } | { ok: false; message: string };

const CreateCampaignSchema = z.object({
  name: z.string().min(2).max(120),
  kind: z.nativeEnum(QrCampaignKind).default(QrCampaignKind.LEAD_CAPTURE),
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
 * Parse the campaign's inline custom-fields builder payload. The form posts
 * a JSON-encoded `LeadFormField[]` as a hidden input; we validate it through
 * the schema and silently fall back to [] if anything's malformed (the form
 * also enforces it client-side, this is the server-side safety net).
 */
function parseCustomFieldsField(fd: FormData): LeadFormField[] {
  const raw = fd.get("customFields")?.toString();
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  const result = leadFormFieldsSchema.safeParse(parsed);
  if (!result.success) {
    logger.warn({ issues: result.error.errors }, "qrCampaign.customFields.validation_failed");
    return [];
  }
  return result.data;
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
  // Admin-only. Campaign creation requires picking an employee owner and a
  // landing template, so we keep it in the admin tools.
  if (actor.role !== Role.ADMIN) {
    return { ok: false, message: "Forbidden" };
  }

  const parsed = CreateCampaignSchema.safeParse({
    name: fd.get("name")?.toString().trim() ?? "",
    kind: fd.get("kind")?.toString() || QrCampaignKind.LEAD_CAPTURE,
    productId: fd.get("productId")?.toString() ?? "",
    ...readLandingFields(fd),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.errors[0]?.message ?? "Invalid input" };
  }
  const d = parsed.data;

  // The actor is always the campaign's owner — the form no longer asks for
  // one. To assign a campaign to a different user, an admin creates it here
  // and then can reassign through Prisma (or a future admin-only action).
  const employeeId = actor.id;

  // Ambassador-invite campaigns don't carry a product or custom fields (they
  // collect new users, not leads). Strip them out so those form values are
  // ignored when this kind is selected.
  const productId = d.kind === QrCampaignKind.AMBASSADOR_INVITE ? "" : d.productId;
  const customFields =
    d.kind === QrCampaignKind.AMBASSADOR_INVITE ? [] : parseCustomFieldsField(fd);

  // Slug must be unique; retry on the (vanishingly rare) collision.
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = makeCampaignSlug();
    try {
      const created = await qrCampaignRepository.create({
        name: d.name,
        slug,
        kind: d.kind,
        employee: { connect: { id: employeeId } },
        ...(productId ? { product: { connect: { id: productId } } } : {}),
        headerImageUrl: nullIfEmpty(d.headerImageUrl ?? ""),
        titleEn: nullIfEmpty(d.titleEn ?? ""),
        titleAr: nullIfEmpty(d.titleAr ?? ""),
        subtitleEn: nullIfEmpty(d.subtitleEn ?? ""),
        subtitleAr: nullIfEmpty(d.subtitleAr ?? ""),
        bodyMdEn: nullIfEmpty(d.bodyMdEn ?? ""),
        bodyMdAr: nullIfEmpty(d.bodyMdAr ?? ""),
        customFields: customFields as unknown as object,
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

// ── Use template ───────────────────────────────────────────────────────────

export type UseTemplateState = { ok: true; slug: string } | { ok: false; message: string };

/**
 * Mint a new LEAD_CAPTURE campaign for the current user from an admin-managed
 * landing template. Any role that has `create:qr` (own scope) can run this —
 * the campaign is always owned by the actor, so it doesn't grant create rights
 * for other users. Each call produces a fresh campaign with a unique slug so
 * each user gets their own share URL / QR.
 */
export async function applyCampaignTemplateAction(fd: FormData): Promise<UseTemplateState> {
  const actor = await requireActor();
  const templateId = fd.get("templateId")?.toString();
  if (!templateId) return { ok: false, message: "Missing template id" };

  const tpl = await prisma.qrLandingTemplate.findUnique({ where: { id: templateId } });
  if (!tpl || !tpl.isActive) return { ok: false, message: "Template not available" };

  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = makeCampaignSlug();
    try {
      const created = await qrCampaignRepository.create({
        name: tpl.name,
        slug,
        kind: tpl.kind,
        employee: { connect: { id: actor.id } },
        headerImageUrl: tpl.headerImageUrl,
        titleEn: tpl.titleEn,
        titleAr: tpl.titleAr,
        subtitleEn: tpl.subtitleEn,
        subtitleAr: tpl.subtitleAr,
        bodyMdEn: tpl.bodyMdEn,
        bodyMdAr: tpl.bodyMdAr,
        // Snapshot the template's custom field schema onto the new
        // campaign. Editing the template later only affects future
        // campaigns minted from it.
        customFields: tpl.customFields as unknown as object,
      });
      revalidatePath("/qr");
      return { ok: true, slug: created.slug };
    } catch (err) {
      const msg = (err as Error).message ?? "";
      if (msg.includes("Unique constraint")) continue;
      logger.error({ err, templateId }, "qr.use_template_failed");
      return { ok: false, message: "Could not create campaign from template" };
    }
  }
  return { ok: false, message: "Could not allocate a unique slug; please retry." };
}

// ── Update ─────────────────────────────────────────────────────────────────

export type UpdateCampaignState = { ok: true } | { ok: false; message: string };

const UpdateCampaignSchema = CreateCampaignSchema;

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
  // Admin-only.
  if (actor.role !== Role.ADMIN) {
    return { ok: false, message: "Forbidden" };
  }
  const parsed = UpdateCampaignSchema.safeParse({
    name: fd.get("name")?.toString().trim() ?? "",
    kind: fd.get("kind")?.toString() || QrCampaignKind.LEAD_CAPTURE,
    productId: fd.get("productId")?.toString() ?? "",
    ...readLandingFields(fd),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.errors[0]?.message ?? "Invalid input" };
  }
  const d = parsed.data;
  const productId = d.kind === QrCampaignKind.AMBASSADOR_INVITE ? "" : d.productId;
  const customFields =
    d.kind === QrCampaignKind.AMBASSADOR_INVITE ? [] : parseCustomFieldsField(fd);
  try {
    await prisma.qrCampaign.update({
      where: { id },
      data: {
        name: d.name,
        kind: d.kind,
        ...(productId
          ? { product: { connect: { id: productId } } }
          : { product: { disconnect: true } }),
        headerImageUrl: nullIfEmpty(d.headerImageUrl ?? ""),
        titleEn: nullIfEmpty(d.titleEn ?? ""),
        titleAr: nullIfEmpty(d.titleAr ?? ""),
        subtitleEn: nullIfEmpty(d.subtitleEn ?? ""),
        subtitleAr: nullIfEmpty(d.subtitleAr ?? ""),
        bodyMdEn: nullIfEmpty(d.bodyMdEn ?? ""),
        bodyMdAr: nullIfEmpty(d.bodyMdAr ?? ""),
        customFields: customFields as unknown as object,
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

export async function deleteCampaignAction(id: string): Promise<SmartDeleteResult> {
  const actor = await requireActor();
  if (actor.role !== Role.ADMIN) return { ok: false, message: "Forbidden" };
  if (!id) return { ok: false, message: "Missing id" };
  const result = await smartDelete({
    label: "qrCampaign",
    id,
    hard: () => prisma.qrCampaign.delete({ where: { id } }),
    soft: () => prisma.qrCampaign.update({ where: { id }, data: { isActive: false } }),
  });
  if (result.ok) {
    revalidatePath("/qr");
    revalidatePath(`/qr/${id}/edit`);
  }
  return result;
}

export type ToggleCampaignState = { ok: true } | { ok: false; message: string };

export async function setCampaignActiveAction(
  _prev: ToggleCampaignState | null,
  fd: FormData,
): Promise<ToggleCampaignState> {
  const actor = await requireActor();
  const id = fd.get("id")?.toString();
  const isActive = fd.get("isActive")?.toString() === "true";
  if (!id) return { ok: false, message: "Missing id" };
  // Admin-only.
  if (actor.role !== Role.ADMIN) {
    return { ok: false, message: "Forbidden" };
  }
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

  // Resolve code: campaign slug first, then user referral code. We DON'T
  // assign business line / owner / product from the link — those are left
  // for an admin to triage later. We keep `referredByEmployeeId` so the
  // person whose link was scanned still sees the lead in their scope.
  const campaign = await qrCampaignRepository.findActiveBySlug(d.code);
  let referrerId: string | null = null;
  let campaignId: string | null = null;
  if (campaign) {
    referrerId = campaign.employee.id;
    campaignId = campaign.id;
  } else {
    const employee = await prisma.user.findUnique({
      where: { referralCode: d.code },
      select: { id: true, isActive: true },
    });
    if (!employee || !employee.isActive) {
      return { ok: false, message: "Invalid referral code" };
    }
    referrerId = employee.id;
  }

  // Resolve the referrer for the auto-NOTE so leads coming in through an
  // ambassador's link surface that name on the timeline.
  const referrer = await prisma.user.findUnique({
    where: { id: referrerId },
    select: { role: true, nameEn: true, nameAr: true, groupId: true },
  });
  const referrerName =
    referrer?.nameEn?.trim() || referrer?.nameAr?.trim() || referrer?.groupId || "";
  const isAmbassadorReferrer = referrer?.role === Role.AMBASSADOR;

  // Validate custom fields against the campaign's own definitions. The form
  // posts answers as cf_<fieldKey>; we read the field schema from the
  // campaign row so a tampered client can't change which fields are required.
  const campaignFields = campaign ? readFields(campaign.customFields) : [];
  let customFields: Record<string, string | number | boolean> | null = null;
  if (campaignFields.length > 0) {
    const result = buildCustomFieldsFromForm(campaignFields, fd);
    if (!result.ok) return { ok: false, message: result.message };
    customFields = result.values;
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
      ...(referrerId ? { referredBy: { connect: { id: referrerId } } } : {}),
      ...(campaignId ? { campaign: { connect: { id: campaignId } } } : {}),
      ...(customFields ? { customFields } : {}),
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
          content:
            (campaignId
              ? `Submitted via QR campaign (${d.code})`
              : `Submitted via referral link (${d.code})`) +
            (isAmbassadorReferrer && referrerName ? ` — Ambassador: ${referrerName}` : ""),
          actorId: referrerId!,
        },
      })
      .catch(() => undefined);

    // Notify the referrer (the person whose link / QR brought this lead in).
    if (referrerId) {
      await notify({
        userId: referrerId,
        payload: {
          type: NotificationType.NEW_LEAD_FROM_QR,
          leadId: lead.id,
          customerName: d.customerName,
          customerPhone: d.customerPhone,
          campaignSlug: campaign?.slug ?? null,
        },
      });
    }

    revalidatePath("/leads");
    return { ok: true };
  } catch (err) {
    logger.error({ err }, "qr.public_lead.create_failed");
    return { ok: false, message: "Could not submit, please retry." };
  }
}

// ── Public ambassador signup ────────────────────────────────────────────────

export type AmbassadorSignupState =
  | { ok: true }
  | { ok: false; message?: string; fieldErrors?: Record<string, string> };

const AmbassadorSignupSchema = z
  .object({
    code: z.string().min(2).max(40),
    nameEn: z.string().trim().min(2).max(120),
    nameAr: z.string().trim().min(2).max(120),
    email: z.string().email().max(160),
    phone: z.string().regex(/^\+?[0-9\s-]{8,20}$/u, "Invalid phone number"),
    password: z.string().min(8).max(128),
    passwordConfirm: z.string(),
    consentGiven: z.coerce.boolean().refine((v) => v === true, "Consent required"),
    company: z.string().optional(),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    path: ["passwordConfirm"],
    message: "Passwords don't match",
  });

/**
 * Allocate the next R####R group ID. Ambassadors are numbered sequentially
 * starting at R0001R. Caller is responsible for handling the unique-constraint
 * retry if two simultaneous signups race for the same number.
 */
async function nextAmbassadorGroupId(): Promise<string> {
  const last = await prisma.user.findFirst({
    where: { role: Role.AMBASSADOR, groupId: { startsWith: "R" } },
    orderBy: { groupId: "desc" },
    select: { groupId: true },
  });
  const n = last?.groupId?.match(/^R(\d{4})R$/u)?.[1];
  const next = (n ? Number.parseInt(n, 10) : 0) + 1;
  if (next > 9999) {
    throw new Error("Ambassador ID space exhausted");
  }
  return `R${next.toString().padStart(4, "0")}R`;
}

/**
 * Public action invoked from /r/<slug> when the campaign's kind is
 * AMBASSADOR_INVITE. Creates a new ambassador user with the next available
 * R####R group ID, links them to the inviting employee, and signs them in.
 */
export async function ambassadorSignupAction(
  _prev: AmbassadorSignupState | null,
  fd: FormData,
): Promise<AmbassadorSignupState> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "unknown";

  // Per-IP rate limit: 5 signups / hour, same as public lead.
  if (!rateLimit(`ambassador-signup:${ip}`, 5, 60 * 60 * 1000)) {
    return { ok: false, message: "Too many requests, please try again later." };
  }

  const parsed = AmbassadorSignupSchema.safeParse({
    code: fd.get("code")?.toString() ?? "",
    nameEn: fd.get("nameEn")?.toString() ?? "",
    nameAr: fd.get("nameAr")?.toString() ?? "",
    email: fd.get("email")?.toString() ?? "",
    phone: fd.get("phone")?.toString() ?? "",
    password: fd.get("password")?.toString() ?? "",
    passwordConfirm: fd.get("passwordConfirm")?.toString() ?? "",
    consentGiven: fd.get("consentGiven") === "on" || fd.get("consentGiven") === "true",
    company: fd.get("company")?.toString() ?? "",
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.errors) {
      const key = issue.path[0]?.toString();
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, fieldErrors };
  }
  const d = parsed.data;

  // Honeypot.
  if (d.company && d.company.trim() !== "") {
    logger.warn({ ip, code: d.code }, "qr.ambassador_signup.honeypot");
    return { ok: true };
  }

  const campaign = await qrCampaignRepository.findActiveBySlug(d.code);
  if (!campaign || campaign.kind !== QrCampaignKind.AMBASSADOR_INVITE) {
    return { ok: false, message: "This invitation link is not valid." };
  }
  if (campaign.employee.role === Role.AMBASSADOR) {
    return { ok: false, message: "Forbidden" };
  }

  const email = d.email.toLowerCase();
  const phone = d.phone.trim();

  const conflict = await prisma.user.findFirst({
    where: { OR: [{ email }, { phone }] },
    select: { email: true, phone: true },
  });
  if (conflict) {
    const fieldErrors: Record<string, string> = {};
    if (conflict.email === email) fieldErrors.email = "This email is already registered";
    if (conflict.phone === phone) fieldErrors.phone = "This phone is already registered";
    return { ok: false, fieldErrors };
  }

  const passwordHash = await argon2.hash(d.password, { type: argon2.argon2id });

  let createdGroupId: string | null = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = await nextAmbassadorGroupId();
    try {
      await prisma.user.create({
        data: {
          groupId: candidate,
          referralCode: candidate,
          role: Role.AMBASSADOR,
          nameEn: d.nameEn.trim(),
          nameAr: d.nameAr.trim(),
          email,
          phone,
          passwordHash,
          invitedById: campaign.employee.id,
          mustCompleteProfile: false,
          isActive: true,
        },
      });
      createdGroupId = candidate;
      break;
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === "P2002") continue; // R-id raced or email/phone race; retry
      logger.error({ err, code: d.code }, "qr.ambassador_signup.create_failed");
      return { ok: false, message: "Could not create your account. Please retry." };
    }
  }
  if (!createdGroupId) {
    return { ok: false, message: "Could not allocate an ID; please retry." };
  }

  // Notify the inviting employee in-app.
  await notify({
    userId: campaign.employee.id,
    payload: {
      type: NotificationType.SYSTEM,
      kind: "AMBASSADOR_JOINED",
      ambassadorGroupId: createdGroupId,
      ambassadorNameEn: d.nameEn.trim(),
      ambassadorNameAr: d.nameAr.trim(),
      campaignSlug: campaign.slug,
    },
  });

  // Auto sign-in the new ambassador, mirroring the onboard flow.
  try {
    await signIn("credentials", {
      identifier: createdGroupId,
      password: d.password,
      redirectTo: "/dashboard",
    });
    return { ok: true };
  } catch (err) {
    // next-auth throws a redirect to complete the sign-in; let Next handle it.
    throw err;
  }
}
