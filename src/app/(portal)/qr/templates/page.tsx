import { getLocale, getTranslations } from "next-intl/server";
import { requireActor } from "@/lib/auth/session";
import { requireFeatureAccess } from "@/lib/auth/permissions";
import { qrLandingTemplateRepository } from "@/server/repositories/qrLandingTemplate.repository";
import { localized } from "@/lib/i18n/localized";
import type { AppLocale } from "@/lib/i18n/config";
import { Card, CardContent } from "@/components/ui/card";
import { UseTemplateButton } from "@/components/portal/UseTemplateButton";

export default async function QrTemplatesGalleryPage() {
  const actor = await requireActor();
  requireFeatureAccess(actor, "qr");
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("qr.gallery");

  const templates = await qrLandingTemplateRepository.list();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <div className="brand-underline mt-2 w-16" />
        <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      {templates.length === 0 ? (
        <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          {t("empty")}
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((tpl) => {
            const title = localized(locale, tpl.titleEn ?? "", tpl.titleAr ?? "");
            const subtitle = localized(locale, tpl.subtitleEn ?? "", tpl.subtitleAr ?? "");
            return (
              <Card key={tpl.id} className="overflow-hidden">
                {tpl.headerImageUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={tpl.headerImageUrl}
                    alt=""
                    className="max-h-40 w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : null}
                <CardContent className="space-y-3 pt-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      {tpl.name}
                    </p>
                    {title ? <h2 className="mt-1 text-base font-semibold">{title}</h2> : null}
                    {subtitle ? (
                      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
                    ) : null}
                  </div>
                  <UseTemplateButton templateId={tpl.id} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
