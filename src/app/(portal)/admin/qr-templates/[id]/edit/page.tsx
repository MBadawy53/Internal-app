import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Role } from "@prisma/client";
import { requireActor } from "@/lib/auth/session";
import { qrLandingTemplateRepository } from "@/server/repositories/qrLandingTemplate.repository";
import { Card, CardContent } from "@/components/ui/card";
import { QrTemplateForm } from "@/components/portal/QrTemplateForm";

interface Params {
  params: Promise<{ id: string }>;
}

export default async function EditQrTemplatePage({ params }: Params) {
  const actor = await requireActor();
  if (actor.role !== Role.ADMIN) redirect("/dashboard");
  const { id } = await params;
  const tpl = await qrLandingTemplateRepository.findById(id);
  if (!tpl) notFound();
  const t = await getTranslations("qrTemplates");
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("edit")}</h1>
        <div className="brand-underline mt-2 w-16" />
        <p className="mt-1 text-sm text-muted-foreground">{tpl.name}</p>
      </header>
      <Card>
        <CardContent className="pt-6">
          <QrTemplateForm
            initial={{
              id: tpl.id,
              name: tpl.name,
              kind: tpl.kind,
              headerImageUrl: tpl.headerImageUrl,
              titleEn: tpl.titleEn,
              titleAr: tpl.titleAr,
              subtitleEn: tpl.subtitleEn,
              subtitleAr: tpl.subtitleAr,
              bodyMdEn: tpl.bodyMdEn,
              bodyMdAr: tpl.bodyMdAr,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
