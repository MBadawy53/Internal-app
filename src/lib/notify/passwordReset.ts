import { Role } from "@prisma/client";
import { logger } from "@/lib/logger";
import { integrationConfigRepository } from "@/server/repositories/integrationConfig.repository";

interface ResetTarget {
  id: string;
  role: Role;
  email: string | null;
  phone: string | null;
  nameEn: string | null;
}

export type DeliveryChannel = "email" | "whatsapp" | "none";

interface DeliveryResult {
  channel: DeliveryChannel;
  delivered: boolean;
}

/**
 * Best-effort dispatch of a password reset link. The actual provider calls
 * (SMTP / WhatsApp Cloud API) are not wired yet; this routes by persona and
 * checks integration configuration, logging the attempt so admins can grab
 * the link from server logs while the integrations are still being set up.
 *
 * Returns the chosen channel and whether delivery was actually attempted —
 * the caller MUST NOT surface this to anonymous self-serve users (it would
 * leak whether the account exists). Admin-issue paths receive the link
 * directly and don't depend on this.
 */
export async function sendPasswordResetLink(
  user: ResetTarget,
  link: string,
): Promise<DeliveryResult> {
  const wantsEmail = user.role !== Role.AMBASSADOR && Boolean(user.email);
  const wantsWhatsApp = user.role === Role.AMBASSADOR && Boolean(user.phone);

  if (wantsEmail) {
    const cfg = await integrationConfigRepository.loadEmailForView();
    if (cfg.isEnabled && cfg.hasPassword) {
      // TODO: wire SMTP send via configured provider.
      logger.info(
        { userId: user.id, channel: "email", to: user.email },
        "passwordReset.delivery.pending_send",
      );
      return { channel: "email", delivered: false };
    }
    logger.warn(
      { userId: user.id, link },
      "passwordReset.delivery.email_not_configured — admin must hand out link",
    );
    return { channel: "email", delivered: false };
  }

  if (wantsWhatsApp) {
    const cfg = await integrationConfigRepository.loadWhatsAppForView();
    if (cfg.isEnabled && cfg.hasAccessToken) {
      // TODO: wire WhatsApp Cloud API send.
      logger.info(
        { userId: user.id, channel: "whatsapp", to: user.phone },
        "passwordReset.delivery.pending_send",
      );
      return { channel: "whatsapp", delivered: false };
    }
    logger.warn(
      { userId: user.id, link },
      "passwordReset.delivery.whatsapp_not_configured — admin must hand out link",
    );
    return { channel: "whatsapp", delivered: false };
  }

  logger.warn({ userId: user.id, link }, "passwordReset.delivery.no_channel_available");
  return { channel: "none", delivered: false };
}
