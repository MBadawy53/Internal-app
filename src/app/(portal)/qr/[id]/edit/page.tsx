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

interface Params {
  params: Promise<{ id: string }>;
}

export default async function EditQrCampaignPage({ params }: Params) {
  const actor = await requireActor();
  if (actor.role !== Role.ADMIN && actor.role !== Role.BUSINESS_LINE_OWNER) {
    redirect("/qr");
  }

  const { id } = await params;
  const campaign = await prisma.qrCampaign.findUnique({ where: { id } });
  if (!campaign) notFound();

  // BL owners can only edit campaigns whose owner is in their BL.
  if (actor.role === Role.BUSINESS_LINE_OWNER) {
    const owner = await prisma.user.findUnique({
      where: { id: campaign.employeeId },
      select: { businessLineId: true },
    });
    if (owner?.businessLineId !== actor.businessLineId) redirect("/qr");
  }

  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("qr");

  const where =
    actor.role === Role.ADMIN
      ? { isActive: true, role: { in: [Role.EMPLOYEE, Role.TEAM_MANAGER] } }
      : {
          isActive: true,
          role: { in: [Role.EMPLOYEE, Role.TEAM_MANAGER] },
          businessLineId: actor.businessLineId ?? undefined,
        };
  const emps = await prisma.user.findMany({
    where,
    select: { id: true, nameEn: true, nameAr: true, businessLineId: true },
    orderBy: { nameEn: "asc" },
    take: 500,
  });
  const employees = emps.map((e) => ({
    id: e.id,
    name: localized(locale, e.nameEn ?? "", e.nameAr ?? ""),
    businessLineId: e.businessLineId ?? undefined,
  }));
  const prods = await catalogService.listProducts(actor);
  const products = prods.map((p) => ({
    id: p.id,
    name: localized(locale, p.nameEn, p.nameAr),
    businessLineId: p.businessLineId,
  }));

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
            employees={employees}
            products={products}
            templates={await qrLandingTemplateRepository.list()}
            initial={{
              id: campaign.id,
              name: campaign.name,
              employeeId: campaign.employeeId,
              productId: campaign.productId,
              headerImageUrl: campaign.headerImageUrl,
              titleEn: campaign.titleEn,
              titleAr: campaign.titleAr,
              subtitleEn: campaign.subtitleEn,
              subtitleAr: campaign.subtitleAr,
              bodyMdEn: campaign.bodyMdEn,
              bodyMdAr: campaign.bodyMdAr,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
