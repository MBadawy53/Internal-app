import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Role } from "@prisma/client";
import { requireActor } from "@/lib/auth/session";
import { leadFormTemplateRepository } from "@/server/repositories/leadFormTemplate.repository";
import { Card, CardContent } from "@/components/ui/card";
import { QrTemplateForm } from "@/components/portal/QrTemplateForm";

export default async function NewQrTemplatePage() {
  const actor = await requireActor();
  if (actor.role !== Role.ADMIN) redirect("/dashboard");
  const t = await getTranslations("qrTemplates");
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("new")}</h1>
        <div className="brand-underline mt-2 w-16" />
      </header>
      <Card>
        <CardContent className="pt-6">
          <QrTemplateForm leadFormTemplates={await leadFormTemplateRepository.listActive()} />
        </CardContent>
      </Card>
    </div>
  );
}
