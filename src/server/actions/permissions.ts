"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";
import { requireActor } from "@/lib/auth/session";
import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { invalidateEffectiveMatrix, FEATURE_KEYS, type FeatureKey } from "@/lib/auth/rbac";
import { logger } from "@/lib/logger";

const EDITABLE_ROLES: Role[] = [
  Role.EMPLOYEE,
  Role.TEAM_MANAGER,
  Role.BUSINESS_LINE_OWNER,
  Role.AMBASSADOR,
];

// The set of (action, resource) pairs admins are allowed to toggle. Excludes
// admin-only resources like user/integrationConfig/auditLog/messageTemplate.
export const EDITABLE_PERMS: { action: string; resource: string }[] = [
  { action: "read", resource: "catalog" },
  { action: "list", resource: "product" },
  { action: "read", resource: "product" },
  { action: "create", resource: "product" },
  { action: "update", resource: "product" },
  { action: "delete", resource: "product" },
  { action: "list", resource: "productCategory" },
  { action: "read", resource: "productCategory" },
  { action: "create", resource: "productCategory" },
  { action: "update", resource: "productCategory" },
  { action: "delete", resource: "productCategory" },
  { action: "list", resource: "productAttribute" },
  { action: "read", resource: "productAttribute" },
  { action: "list", resource: "businessLine" },
  { action: "read", resource: "businessLine" },
  { action: "read", resource: "calculator" },
  { action: "create", resource: "quote" },
  { action: "read", resource: "quote" },
  { action: "list", resource: "quote" },
  { action: "create", resource: "lead" },
  { action: "read", resource: "lead" },
  { action: "list", resource: "lead" },
  { action: "update", resource: "lead" },
  { action: "delete", resource: "lead" },
  { action: "export", resource: "lead" },
  { action: "assign", resource: "lead" },
  { action: "create", resource: "qr" },
  { action: "read", resource: "qr" },
  { action: "list", resource: "qr" },
  { action: "update", resource: "qr" },
  { action: "delete", resource: "qr" },
  { action: "read", resource: "notification" },
  { action: "list", resource: "notification" },
  { action: "update", resource: "notification" },
  { action: "read", resource: "report" },
];

const PermissionSchema = z.object({
  role: z.nativeEnum(Role).refine((r) => EDITABLE_ROLES.includes(r), {
    message: "Role not editable",
  }),
  features: z.array(z.string()), // FeatureKey strings that should be visible
  permissions: z.array(z.string()), // "action:resource" strings that should be enabled
});

export type SavePermissionsState = { ok: true } | { ok: false; message: string };

export async function saveRolePermissionsAction(
  _prev: SavePermissionsState | null,
  fd: FormData,
): Promise<SavePermissionsState> {
  const actor = await requireActor();
  // Admin-only.
  requirePermission(actor, "update", "user"); // closest existing permission gate.

  const parsed = PermissionSchema.safeParse({
    role: fd.get("role"),
    features: fd.getAll("features").map((v) => v.toString()),
    permissions: fd.getAll("permissions").map((v) => v.toString()),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.errors[0]?.message ?? "Invalid input" };
  }
  const { role, features, permissions } = parsed.data;

  const visibleSet = new Set(
    features.filter((f) => (FEATURE_KEYS as readonly string[]).includes(f)),
  );
  const enabledKeys = new Set(permissions);

  try {
    await prisma.$transaction(async (tx) => {
      // Replace this role's feature-visibility rows with the new snapshot.
      await tx.roleFeatureAccess.deleteMany({ where: { role } });
      const featureRows = FEATURE_KEYS.map((f) => ({
        role,
        feature: f as FeatureKey,
        visible: visibleSet.has(f),
      }));
      await tx.roleFeatureAccess.createMany({ data: featureRows });

      // Replace this role's permission overrides with the new snapshot.
      await tx.rolePermission.deleteMany({ where: { role } });
      const permRows = EDITABLE_PERMS.map(({ action, resource }) => ({
        role,
        action,
        resource,
        enabled: enabledKeys.has(`${action}:${resource}`),
      }));
      await tx.rolePermission.createMany({ data: permRows });
    });
    invalidateEffectiveMatrix();
    revalidatePath("/admin/permissions");
    return { ok: true };
  } catch (err) {
    logger.error({ err, role }, "permissions.save_failed");
    return { ok: false, message: "Could not save permissions, please retry." };
  }
}
