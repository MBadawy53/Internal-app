import { IntegrationKey } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { decryptOptional } from "@/lib/crypto/aes-gcm";

async function loadDecrypted<T>(key: IntegrationKey): Promise<T | null> {
  const row = await prisma.integrationConfig.findUnique({ where: { key } });
  if (!row) return null;
  try {
    const plain = decryptOptional(row.valueEncJson);
    return plain ? (JSON.parse(plain) as T) : null;
  } catch {
    return null;
  }
}

export type WhatsAppConfigView = {
  isEnabled: boolean;
  hasAccessToken: boolean;
  phoneNumberId: string;
  businessAccountId: string;
};

export type EmailConfigView = {
  isEnabled: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpSecure: boolean;
  hasPassword: boolean;
  fromAddress: string;
  fromName: string;
};

export const integrationConfigRepository = {
  loadWhatsAppForView: async (): Promise<WhatsAppConfigView> => {
    const row = await prisma.integrationConfig.findUnique({
      where: { key: IntegrationKey.WHATSAPP_PROVIDER },
    });
    const cfg =
      (await loadDecrypted<Record<string, unknown>>(IntegrationKey.WHATSAPP_PROVIDER)) ?? {};
    return {
      isEnabled: row?.isEnabled ?? false,
      hasAccessToken: typeof cfg.accessToken === "string" && cfg.accessToken.length > 0,
      phoneNumberId: typeof cfg.phoneNumberId === "string" ? cfg.phoneNumberId : "",
      businessAccountId: typeof cfg.businessAccountId === "string" ? cfg.businessAccountId : "",
    };
  },

  loadEmailForView: async (): Promise<EmailConfigView> => {
    const row = await prisma.integrationConfig.findUnique({
      where: { key: IntegrationKey.EMAIL_PROVIDER },
    });
    const cfg = (await loadDecrypted<Record<string, unknown>>(IntegrationKey.EMAIL_PROVIDER)) ?? {};
    return {
      isEnabled: row?.isEnabled ?? false,
      smtpHost: typeof cfg.smtpHost === "string" ? cfg.smtpHost : "",
      smtpPort: typeof cfg.smtpPort === "number" ? cfg.smtpPort : 587,
      smtpUser: typeof cfg.smtpUser === "string" ? cfg.smtpUser : "",
      smtpSecure: cfg.smtpSecure === true,
      hasPassword: typeof cfg.smtpPass === "string" && cfg.smtpPass.length > 0,
      fromAddress: typeof cfg.fromAddress === "string" ? cfg.fromAddress : "",
      fromName: typeof cfg.fromName === "string" ? cfg.fromName : "",
    };
  },

  /** Decrypt a stored secret field for the save action's "keep existing if blank" path. */
  decryptedFor: <T>(key: IntegrationKey) => loadDecrypted<T>(key),
};
