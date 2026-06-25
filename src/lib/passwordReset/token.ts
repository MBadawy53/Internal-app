import { createHash, randomBytes } from "node:crypto";

/**
 * Single-use password reset token. The raw token leaves the server exactly
 * once (in the channel delivery or as the response of the admin-issue action);
 * only the SHA-256 hash is persisted, so a leaked DB row can't be replayed.
 */
export function newResetToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("base64url");
  return { raw, hash: hashResetToken(raw) };
}

export function hashResetToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}
