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
  const scope = scopeFor(actor.role, action, resource);
  if (scope === "none") {
    throw new ForbiddenError(`Role ${actor.role} cannot ${action} ${resource}`);
  }
  return scope;
}
