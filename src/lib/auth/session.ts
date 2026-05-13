import { auth } from "./config";
import { type ActorContext, UnauthorizedError } from "./permissions";
import { ensureEffectiveMatrix } from "./rbac";

export async function getActor(): Promise<ActorContext | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  // Refresh runtime RBAC overrides (bounded by an in-memory TTL).
  await ensureEffectiveMatrix();
  return {
    id: session.user.id,
    role: session.user.role,
    businessLineId: session.user.businessLineId,
    canEditProducts: session.user.canEditProducts ?? false,
    canEditCatalog: session.user.canEditCatalog ?? false,
  };
}

export async function requireActor(): Promise<ActorContext> {
  const actor = await getActor();
  if (!actor) throw new UnauthorizedError();
  return actor;
}
