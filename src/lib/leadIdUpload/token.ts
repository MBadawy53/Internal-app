import { createHash, randomBytes } from "node:crypto";

/**
 * Single-use national-ID upload token. Same SHA-256-hashed pattern as
 * password reset and ambassador invite: the raw token leaves the server
 * once (in the owner's Copy / WhatsApp share panel); the DB stores only
 * the hash so a leaked row can't be replayed.
 */
export function newLeadIdUploadToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("base64url");
  return { raw, hash: hashLeadIdUploadToken(raw) };
}

export function hashLeadIdUploadToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}
