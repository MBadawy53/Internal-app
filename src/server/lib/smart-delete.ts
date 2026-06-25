import { logger } from "@/lib/logger";

export type SmartDeleteResult =
  | { ok: true; mode: "hard" | "soft" }
  | { ok: false; message: string };

/**
 * Smart-delete pattern: try the destructive path first; if Postgres rejects
 * it because of a foreign-key constraint (Prisma P2003) — meaning something
 * still references this row — fall back to a soft-delete that flips an
 * "isActive" (or similar) flag.
 *
 * Both delete functions can throw; this helper turns expected FK violations
 * into a soft fallback, and unexpected errors into a `{ ok: false }` result
 * so the caller's UI can surface a message.
 */
export async function smartDelete(params: {
  /** Slug used in log lines, e.g. "product", "qrCampaign". */
  label: string;
  /** Identifier (id, slug, etc.) for logging. */
  id: string;
  hard: () => Promise<unknown>;
  soft?: () => Promise<unknown>;
}): Promise<SmartDeleteResult> {
  try {
    await params.hard();
    return { ok: true, mode: "hard" };
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === "P2003" || code === "P2014") {
      if (!params.soft) {
        logger.warn(
          { label: params.label, id: params.id, code },
          "smartDelete.hard_failed_no_soft_fallback",
        );
        return {
          ok: false,
          message: "This item is referenced elsewhere and can't be removed.",
        };
      }
      try {
        await params.soft();
        return { ok: true, mode: "soft" };
      } catch (softErr) {
        logger.error(
          { err: softErr, label: params.label, id: params.id },
          "smartDelete.soft_fallback_failed",
        );
        return { ok: false, message: "Could not deactivate the item." };
      }
    }
    logger.error({ err, label: params.label, id: params.id, code }, "smartDelete.unexpected_error");
    return { ok: false, message: "Could not delete." };
  }
}
