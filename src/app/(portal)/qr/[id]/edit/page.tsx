import { notFound, redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Role } from "@prisma/client";
import { requireActor } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { qrLandingTemplateRepository } from "@/server/repositories/qrLandingTemplate.repository";
import { catalogService } from "@/server/services/catalog.service";
import { localized } from "@/lib/i18n/localized";
import type { AppLocale } from "@/lib/i18n/config";
import { Card, CardContent } from "@/components/ui/card";
import { QrCampaignForm } from "@/components/portal/QrCampaignForm";
import { readFields } from "@/lib/leadForm/types";

interface Params {
  params: Promise<{ id: string }>;
}

export default async function EditQrCampaignPage({ params }: Params) {
  const actor = await requireActor();
  // Edit is admin-only.
  if (actor.role !== Role.ADMIN) redirect("/qr");
  const { id } = await params;
  const campaign = await prisma.qrCampaign.findUnique({ where: { id } });
  if (!campaign) notFound();

  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("qr");

  const prods = await catalogService.listProducts(actor);
  const products = prods.map((p) => ({
    id: p.id,
    name: localized(locale, p.nameEn, p.nameAr),
    businessLineId: p.businessLineId,
  }));

  // Other campaigns the admin can copy a field set from.
  const otherCampaigns = await prisma.qrCampaign.findMany({
    where: { id: { not: campaign.id } },
    select: { id: true, name: true, customFields: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  const copySources = otherCampaigns
    .map((c) => ({ id: c.id, name: c.name, fields: readFields(c.customFields) }))
    .filter((s) => s.fields.length > 0);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("edit")}</h1>
        <div className="brand-underline mt-2 w-16" />
        <p className="mt-1 text-sm text-muted-foreground">{campaign.name}</p>
      </header>
      <Card>
        <CardContent className="pt-6">
          <QrCampaignForm
            products={products}
            templates={await qrLandingTemplateRepository.list()}
            copySources={copySources}
            initial={{
              id: campaign.id,
              name: campaign.name,
              kind: campaign.kind,
              productId: campaign.productId,
              headerImageUrl: campaign.headerImageUrl,
              titleEn: campaign.titleEn,
              titleAr: campaign.titleAr,
              subtitleEn: campaign.subtitleEn,
              subtitleAr: campaign.subtitleAr,
              bodyMdEn: campaign.bodyMdEn,
              bodyMdAr: campaign.bodyMdAr,
              customFields: readFields(campaign.customFields),
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
