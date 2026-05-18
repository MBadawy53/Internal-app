import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Role } from "@prisma/client";
import { requireActor } from "@/lib/auth/session";
import { integrationConfigRepository } from "@/server/repositories/integrationConfig.repository";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WhatsAppConfigForm } from "@/components/portal/WhatsAppConfigForm";
import { EmailConfigForm } from "@/components/portal/EmailConfigForm";

export default async function ConfigurationPage() {
  const actor = await requireActor();
  if (actor.role !== Role.ADMIN) redirect("/dashboard");
  const t = await getTranslations("configuration");

  const [whatsapp, email] = await Promise.all([
    integrationConfigRepository.loadWhatsAppForView(),
    integrationConfigRepository.loadEmailForView(),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <div className="brand-underline mt-2 w-16" />
        <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("whatsapp.title")}</CardTitle>
            <p className="text-xs text-muted-foreground">{t("whatsapp.subtitle")}</p>
          </CardHeader>
          <CardContent>
            <WhatsAppConfigForm initial={whatsapp} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("email.title")}</CardTitle>
            <p className="text-xs text-muted-foreground">{t("email.subtitle")}</p>
          </CardHeader>
          <CardContent>
            <EmailConfigForm initial={email} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
