"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { EMPLOYEE_ID_REGEX } from "@/lib/auth/config";
import { requirePermission } from "@/lib/auth/permissions";
import { requireActor } from "@/lib/auth/session";
import { logger } from "@/lib/logger";
import { userAdminRepository } from "@/server/repositories/userAdmin.repository";

const ProvisionSchema = z.object({
  groupId: z.string().regex(EMPLOYEE_ID_REGEX, "Group ID must match C0001C–C9999C"),
  role: z.nativeEnum(Role).refine((r) => r !== Role.AMBASSADOR, {
    message: "Ambassadors are created via QR-campaign invites, not the admin panel.",
  }),
  businessLineId: z.string().min(1).optional().nullable(),
  managerId: z.string().min(1).optional().nullable(),
  canEditProducts: z.coerce.boolean().default(false),
  canEditCatalog: z.coerce.boolean().default(false),
});

export type ProvisionUserState =
  | { ok: true; id: string }
  | { ok: false; fieldErrors?: Record<string, string[]>; message?: string };

export async function provisionUserAction(
  _prev: ProvisionUserState | null,
  formData: FormData,
): Promise<ProvisionUserState> {
  const actor = await requireActor();
  requirePermission(actor, "create", "user");

  const parsed = ProvisionSchema.safeParse({
    groupId: formData.get("groupId")?.toString().toUpperCase().trim() ?? "",
    role: formData.get("role"),
    businessLineId: formData.get("businessLineId")?.toString() || null,
    managerId: formData.get("managerId")?.toString() || null,
    canEditProducts: formData.get("canEditProducts") === "on",
    canEditCatalog: formData.get("canEditCatalog") === "on",
  });
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const { groupId, role, businessLineId, managerId, canEditProducts, canEditCatalog } = parsed.data;

  const existing = await userAdminRepository.findByGroupId(groupId);
  if (existing) {
    return { ok: false, fieldErrors: { groupId: ["Group ID is already in use"] } };
  }

  try {
    const created = await userAdminRepository.provision({
      groupId,
      role,
      businessLineId: businessLineId ?? null,
      managerId: managerId ?? null,
      referralCode: groupId,
      canEditProducts,
      canEditCatalog,
    });
    revalidatePath("/admin/users");
    redirect("/admin/users");
    return { ok: true, id: created.id };
  } catch (err) {
    logger.error({ err, groupId }, "user.provision_failed");
    if ((err as { code?: string }).code === "P2002") {
      return { ok: false, fieldErrors: { groupId: ["Group ID is already in use"] } };
    }
    throw err;
  }
}

const UpdateUserSchema = z.object({
  role: z.nativeEnum(Role),
  businessLineId: z.string().min(1).optional().nullable(),
  managerId: z.string().min(1).optional().nullable(),
  canEditProducts: z.coerce.boolean().default(false),
  canEditCatalog: z.coerce.boolean().default(false),
});

export async function updateUserAction(
  id: string,
  _prev: ProvisionUserState | null,
  formData: FormData,
): Promise<ProvisionUserState> {
  const actor = await requireActor();
  requirePermission(actor, "update", "user");

  const parsed = UpdateUserSchema.safeParse({
    role: formData.get("role"),
    businessLineId: formData.get("businessLineId")?.toString() || null,
    managerId: formData.get("managerId")?.toString() || null,
    canEditProducts: formData.get("canEditProducts") === "on",
    canEditCatalog: formData.get("canEditCatalog") === "on",
  });
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }
  try {
    await userAdminRepository.updateCapabilities(id, {
      role: parsed.data.role,
      businessLineId: parsed.data.businessLineId ?? null,
      managerId: parsed.data.managerId ?? null,
      canEditProducts: parsed.data.canEditProducts,
      canEditCatalog: parsed.data.canEditCatalog,
    });
    revalidatePath("/admin/users");
    redirect("/admin/users");
    return { ok: true, id };
  } catch (err) {
    logger.error({ err, id }, "user.update_failed");
    throw err;
  }
}

export async function deactivateUserAction(id: string): Promise<void> {
  const actor = await requireActor();
  requirePermission(actor, "update", "user");
  await userAdminRepository.setActive(id, false);
  revalidatePath("/admin/users");
}

export async function reactivateUserAction(id: string): Promise<void> {
  const actor = await requireActor();
  requirePermission(actor, "update", "user");
  await userAdminRepository.setActive(id, true);
  revalidatePath("/admin/users");
}
