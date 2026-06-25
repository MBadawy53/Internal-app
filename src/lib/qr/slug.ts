// Small QR helpers — pure, no I/O.
import { randomBytes } from "node:crypto";

/**
 * Generate a slug for a QrCampaign. URL-safe characters only, no ambiguous
 * chars (l/I/0/O removed). 10 chars ≈ 60 bits of entropy — plenty for
 * non-guessability when leaked links are shared.
 */
export function makeCampaignSlug(): string {
  const alphabet = "abcdefghijkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(10);
  let out = "";
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return out;
}
