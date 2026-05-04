import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { env } from "../env";

// AES-256-GCM with a single application key. Single-key scheme by design;
// rotation can be added later by introducing a key id prefix.

const ALGO = "aes-256-gcm" as const;
const IV_LENGTH = 12; // 96 bits, recommended for GCM
const TAG_LENGTH = 16;
const VERSION = "v1" as const;

function getKey(): Buffer {
  return Buffer.from(env.APP_ENCRYPTION_KEY, "hex");
}

/**
 * Encrypt a UTF-8 string. Output format: `v1:<ivBase64>:<tagBase64>:<cipherBase64>`.
 */
export function encrypt(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGO, getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${VERSION}:${iv.toString("base64")}:${tag.toString("base64")}:${ciphertext.toString("base64")}`;
}

/**
 * Decrypt a payload produced by {@link encrypt}. Throws on tampering or wrong key.
 */
export function decrypt(payload: string): string {
  const parts = payload.split(":");
  if (parts.length !== 4 || parts[0] !== VERSION) {
    throw new Error("Invalid ciphertext payload format");
  }
  const [, ivB64, tagB64, dataB64] = parts as [string, string, string, string];
  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const data = Buffer.from(dataB64, "base64");
  if (iv.length !== IV_LENGTH || tag.length !== TAG_LENGTH) {
    throw new Error("Invalid IV or auth tag length");
  }
  const decipher = createDecipheriv(ALGO, getKey(), iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(data), decipher.final()]);
  return plaintext.toString("utf8");
}

export function encryptOptional(value: string | null | undefined): string | null {
  if (value === null || value === undefined || value === "") return null;
  return encrypt(value);
}

export function decryptOptional(value: string | null | undefined): string | null {
  if (!value) return null;
  return decrypt(value);
}
