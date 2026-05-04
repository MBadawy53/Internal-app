import { beforeAll, describe, expect, it } from "vitest";
import { randomBytes } from "node:crypto";

beforeAll(() => {
  // Provide a valid 32-byte hex key so env validation passes when the module is imported.
  process.env.APP_ENCRYPTION_KEY = randomBytes(32).toString("hex");
  process.env.AUTH_SECRET = "test-secret-test-secret-test-secret";
  process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
});

describe("AES-256-GCM helper", () => {
  it("round-trips a UTF-8 string", async () => {
    const { encrypt, decrypt } = await import("@/lib/crypto/aes-gcm");
    const plaintext = "ahmed.h@example.com — مرحبًا 👋";
    const ciphertext = encrypt(plaintext);
    expect(ciphertext.startsWith("v1:")).toBe(true);
    expect(decrypt(ciphertext)).toBe(plaintext);
  });

  it("produces a fresh IV each call (probabilistic)", async () => {
    const { encrypt } = await import("@/lib/crypto/aes-gcm");
    const a = encrypt("same value");
    const b = encrypt("same value");
    expect(a).not.toEqual(b);
  });

  it("rejects tampered ciphertext", async () => {
    const { encrypt, decrypt } = await import("@/lib/crypto/aes-gcm");
    const ct = encrypt("secret");
    const parts = ct.split(":");
    parts[3] = Buffer.from("tampered tampered tampered tampered").toString("base64");
    expect(() => decrypt(parts.join(":"))).toThrow();
  });

  it("rejects an unknown version prefix", async () => {
    const { decrypt } = await import("@/lib/crypto/aes-gcm");
    expect(() => decrypt("v9:aaaa:bbbb:cccc")).toThrow();
  });
});
