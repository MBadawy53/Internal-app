import { createHash, randomBytes } from "node:crypto";

/**
 * Single-use invite token for the ambassador application accept flow.
 * The raw token is shown once to the employee (in the inline Copy / WhatsApp
 * link). Only a SHA-256 hash is stored, so a leaked DB row can't be replayed.
 */
export function newInviteToken(): { raw: string; hash: string } {
  const raw = randomBytes(24).toString("base64url");
  return { raw, hash: hashInviteToken(raw) };
}

export function hashInviteToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}
