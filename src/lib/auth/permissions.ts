import type { Role } from "@prisma/client";
import { type Action, type Resource, type Scope, scopeFor } from "./rbac";

export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export interface ActorContext {
  id: string;
  role: Role;
  businessLineId: string | null;
  canEditProducts: boolean;
  canEditCatalog: boolean;
}

const PRODUCT_FLAG_GRANTS = new Set<`${Action}:${Resource}`>([
  "create:product",
  "update:product",
  "delete:product",
]);

const CATALOG_FLAG_GRANTS = new Set<`${Action}:${Resource}`>([
  "create:productCategory",
  "update:productCategory",
  "delete:productCategory",
]);

/**
 * Per-user override: if `canEditProducts` is set, the actor gets `all` scope on
 * product CRUD regardless of role. Same idea for `canEditCatalog` covering
 * categories + variables. Flags are additive — they upgrade scope but never
 * downgrade what the role already grants.
 */
function flagOverride(actor: ActorContext, action: Action, resource: Resource): Scope | null {
  const key: `${Action}:${Resource}` = `${action}:${resource}`;
  if (actor.canEditProducts && PRODUCT_FLAG_GRANTS.has(key)) return "all";
  if (actor.canEditCatalog && CATALOG_FLAG_GRANTS.has(key)) return "all";
  return null;
}

/**
 * Throws if the actor cannot perform the action on the resource.
 * Returns the granted scope so callers can constrain their query.
 */
export function requirePermission(
  actor: ActorContext | null,
  action: Action,
  resource: Resource,
): Scope {
  if (!actor) throw new UnauthorizedError();
  const flag = flagOverride(actor, action, resource);
  if (flag) return flag;
  const scope = scopeFor(actor.role, action, resource);
  if (scope === "none") {
    throw new ForbiddenError(`Role ${actor.role} cannot ${action} ${resource}`);
  }
  return scope;
}
