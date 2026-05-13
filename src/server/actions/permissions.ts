"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";
import { requireActor } from "@/lib/auth/session";
import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import {
  EDITABLE_PERMS,
  FEATURE_KEYS,
  invalidateEffectiveMatrix,
  type FeatureKey,
} from "@/lib/auth/rbac";
import { logger } from "@/lib/logger";

const EDITABLE_ROLES: Role[] = [
  Role.EMPLOYEE,
  Role.TEAM_MANAGER,
  Role.BUSINESS_LINE_OWNER,
  Role.AMBASSADOR,
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
