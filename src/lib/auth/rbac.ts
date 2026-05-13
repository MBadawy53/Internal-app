import type { Role } from "@prisma/client";

// ─── Permission catalog ──────────────────────────────────────────────────────
// Single source of truth. Every server action / API route must check against this.

export const RESOURCES = [
  "catalog",
  "product",
  "productCategory",
  "productAttribute",
  "calculator",
  "quote",
  "lead",
  "qr",
  "notification",
  "report",
  "user",
  "businessLine",
  "integrationConfig",
  "auditLog",
  "messageTemplate",
] as const;

export type Resource = (typeof RESOURCES)[number];

export const ACTIONS = ["create", "read", "update", "delete", "list", "export", "assign"] as const;
export type Action = (typeof ACTIONS)[number];

export type Permission = `${Action}:${Resource}`;

/**
 * Scope qualifier on what subset of resource rows an actor may touch.
 * Enforced inside the repository / service layer.
 */
export type Scope = "own" | "team" | "businessLine" | "all" | "none";

type RoleMatrix = Record<Role, Partial<Record<Permission, Scope>>>;

export const ROLE_MATRIX: RoleMatrix = {
  EMPLOYEE: {
    "read:catalog": "all",
    "list:product": "all",
    "read:product": "all",
    "list:productCategory": "all",
    "read:productCategory": "all",
    "list:productAttribute": "all",
    "read:productAttribute": "all",
    "list:businessLine": "all",
    "read:businessLine": "all",

    "read:calculator": "all",
    "create:quote": "own",
    "read:quote": "own",
    "list:quote": "own",

    "create:lead": "own",
    "read:lead": "own",
    "list:lead": "own",
    "update:lead": "own",
    "export:lead": "own",
    "assign:lead": "own", // can refer to other BL

    "create:qr": "own",
    "read:qr": "own",
    "list:qr": "own",
    "update:qr": "own",
    "delete:qr": "own",

    "read:notification": "own",
    "list:notification": "own",
    "update:notification": "own",

    "read:report": "own",
  },

  TEAM_MANAGER: {
    "read:catalog": "all",
    "list:product": "all",
    "read:product": "all",
    "list:productCategory": "all",
    "read:productCategory": "all",
    "list:productAttribute": "all",
    "read:productAttribute": "all",
    "list:businessLine": "all",
    "read:businessLine": "all",

    "read:calculator": "all",
    "create:quote": "own",
    "read:quote": "team",
    "list:quote": "team",

    "create:lead": "team",
    "read:lead": "team",
    "list:lead": "team",
    "update:lead": "team",
    "export:lead": "team",
    "assign:lead": "team",

    "create:qr": "own",
    "read:qr": "team",
    "list:qr": "team",
    "update:qr": "own",
    "delete:qr": "own",

    "read:notification": "own",
    "list:notification": "own",
    "update:notification": "own",

    "read:report": "team",
  },

  BUSINESS_LINE_OWNER: {
    "read:catalog": "all",
    "list:product": "all",
    "read:product": "all",
    "list:businessLine": "all",
    "read:businessLine": "all",
    "create:product": "businessLine",
    "update:product": "businessLine",
    "delete:product": "businessLine",

    // Categories — global per Q9: any BL Owner can manage any category.
    "list:productCategory": "all",
    "read:productCategory": "all",
    "create:productCategory": "all",
    "update:productCategory": "all",
    "delete:productCategory": "all",

    // Attributes are admin-only at create/update/delete; all roles can read.

    "read:calculator": "all",
    "create:quote": "own",
    "read:quote": "businessLine",
    "list:quote": "businessLine",

    "create:lead": "businessLine",
    "read:lead": "businessLine",
    "list:lead": "businessLine",
    "update:lead": "businessLine",
    "export:lead": "businessLine",
    "assign:lead": "businessLine",

    "create:qr": "own",
    "read:qr": "businessLine",
    "list:qr": "businessLine",
    "update:qr": "own",
    "delete:qr": "own",

    "read:notification": "own",
    "list:notification": "own",
    "update:notification": "own",

    "read:report": "businessLine",
  },

  ADMIN: {
    "read:catalog": "all",
    "list:product": "all",
    "read:product": "all",
    "create:product": "all",
    "update:product": "all",
    "delete:product": "all",

    "list:productCategory": "all",
    "read:productCategory": "all",
    "create:productCategory": "all",
    "update:productCategory": "all",
    "delete:productCategory": "all",

    "list:productAttribute": "all",
    "read:productAttribute": "all",
    "create:productAttribute": "all",
    "update:productAttribute": "all",
    "delete:productAttribute": "all",

    "read:calculator": "all",
    "create:quote": "all",
    "read:quote": "all",
    "list:quote": "all",
    "delete:quote": "all",

    "create:lead": "all",
    "read:lead": "all",
    "list:lead": "all",
    "update:lead": "all",
    "delete:lead": "all",
    "export:lead": "all",
    "assign:lead": "all",

    "create:qr": "all",
    "read:qr": "all",
    "list:qr": "all",
    "update:qr": "all",
    "delete:qr": "all",

    "read:notification": "all",
    "list:notification": "all",
    "update:notification": "all",

    "read:report": "all",

    "create:user": "all",
    "read:user": "all",
    "list:user": "all",
    "update:user": "all",
    "delete:user": "all",

    "create:businessLine": "all",
    "read:businessLine": "all",
    "list:businessLine": "all",
    "update:businessLine": "all",
    "delete:businessLine": "all",

    "read:integrationConfig": "all",
    "update:integrationConfig": "all",

    "read:auditLog": "all",
    "list:auditLog": "all",

    "read:messageTemplate": "all",
    "list:messageTemplate": "all",
    "update:messageTemplate": "all",
  },

  AMBASSADOR: {
    "read:catalog": "all",
    "list:product": "all",
    "read:product": "all",
    "list:productCategory": "all",
    "read:productCategory": "all",
    "list:productAttribute": "all",
    "read:productAttribute": "all",
    "list:businessLine": "all",
    "read:businessLine": "all",

    "create:lead": "own",
    "read:lead": "own",
    "list:lead": "own",
    "update:lead": "own",

    "create:qr": "own",
    "read:qr": "own",
    "list:qr": "own",
    "update:qr": "own",
    "delete:qr": "own",

    "read:notification": "own",
    "list:notification": "own",
    "update:notification": "own",
  },
};

/**
 * Returns the row scope for a role/permission, or "none" if the role lacks the permission.
 */
export function scopeFor(role: Role, action: Action, resource: Resource): Scope {
  const key: Permission = `${action}:${resource}`;
  return ROLE_MATRIX[role][key] ?? "none";
}

export function can(role: Role, action: Action, resource: Resource): boolean {
  return scopeFor(role, action, resource) !== "none";
}
