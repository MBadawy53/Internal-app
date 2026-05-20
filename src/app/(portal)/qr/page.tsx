import { getLocale, getTranslations } from "next-intl/server";
import { Role } from "@prisma/client";
import { requireActor } from "@/lib/auth/session";
import { requireFeatureAccess } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { qrCampaignRepository } from "@/server/repositories/qrCampaign.repository";
import { qrLandingTemplateRepository } from "@/server/repositories/qrLandingTemplate.repository";
import { catalogService } from "@/server/services/catalog.service";
import { localized } from "@/lib/i18n/localized";
import type { AppLocale } from "@/lib/i18n/config";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NewCampaignSection } from "@/components/portal/NewCampaignSection";
import { QrRangeFilter } from "@/components/portal/QrRangeFilter";
import { readFields } from "@/lib/leadForm/types";

type RangePreset = "7d" | "30d" | "90d" | "all";

function resolveRange(sp: { range?: string; from?: string; to?: string }): {
  from: Date | null;
  to: Date | null;
} {
  const parseDate = (s: string | undefined) => {
    if (!s) return null;
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
  };
  const custom = parseDate(sp.from);
  const customTo = parseDate(sp.to);
  if (custom || customTo) {
    return {
      from: custom,
      to: customTo ? new Date(customTo.getTime() + 24 * 60 * 60 * 1000) : null,
    };
  }
  const preset = (sp.range as RangePreset | undefined) ?? "30d";
  if (preset === "all") return { from: null, to: null };
  const days = preset === "7d" ? 7 : preset === "90d" ? 90 : 30;
  return { from: new Date(Date.now() - days * 24 * 60 * 60 * 1000), to: null };
}

export default async function QrPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const actor = await requireActor();
  requireFeatureAccess(actor, "qr");
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("qr");
  const sp = await searchParams;

  const campaigns = await qrCampaignRepository.listForActor({
    id: actor.id,
    role: actor.role,
    businessLineId: actor.businessLineId,
  });

  const { from, to } = resolveRange(sp);
  const createdAt =
    from || to ? { ...(from ? { gte: from } : {}), ...(to ? { lt: to } : {}) } : undefined;

  // Per-campaign scan + lead counts in the chosen range.
  const campaignIds = campaigns.map((c) => c.id);
  const [scanGroups, leadGroups] = await Promise.all([
    campaignIds.length === 0
      ? []
      : prisma.qrScan.groupBy({
          by: ["campaignId"],
          where: { campaignId: { in: campaignIds }, ...(createdAt ? { createdAt } : {}) },
          _count: { _all: true },
        }),
    campaignIds.length === 0
      ? []
      : prisma.lead.groupBy({
          by: ["campaignId"],
          where: { campaignId: { in: campaignIds }, ...(createdAt ? { createdAt } : {}) },
          _count: { _all: true },
        }),
  ]);
  const scanByCampaign = new Map<string, number>();
  for (const g of scanGroups) if (g.campaignId) scanByCampaign.set(g.campaignId, g._count._all);
  const leadByCampaign = new Map<string, number>();
  for (const g of leadGroups) if (g.campaignId) leadByCampaign.set(g.campaignId, g._count._all);

  // Create + edit are admin-only. Other roles can only view campaigns scoped
  // to them by `qrCampaignRepository.listForActor`.
  const isAdmin = actor.role === Role.ADMIN;

  let products: { id: string; name: string; businessLineId: string }[] = [];
  let templates: Awaited<ReturnType<typeof qrLandingTemplateRepository.list>> = [];
  let copySources: { id: string; name: string; fields: ReturnType<typeof readFields> }[] = [];
  if (isAdmin) {
    templates = await qrLandingTemplateRepository.list();
    const prods = await catalogService.listProducts(actor);
    products = prods.map((p) => ({
      id: p.id,
      name: localized(locale, p.nameEn, p.nameAr),
      businessLineId: p.businessLineId,
    }));
    const otherCampaigns = await prisma.qrCampaign.findMany({
      select: { id: true, name: true, customFields: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    copySources = otherCampaigns
      .map((c) => ({ id: c.id, name: c.name, fields: readFields(c.customFields) }))
      .filter((s) => s.fields.length > 0);
  }

  // Public base URL for the share link.
  const publicBase =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <div className="brand-underline mt-2 w-16" />
        <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <QrRangeFilter />
        <Link href="/qr/templates">
          <Button type="button" variant="outline">
            {t("browseTemplates")}
          </Button>
        </Link>
      </div>

      {isAdmin ? (
        <NewCampaignSection
          products={products}
          templates={templates}
          copySources={copySources}
          initial={{}}
        />
      ) : null}

      {campaigns.length === 0 ? (
        <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          {t("empty")}
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {campaigns.map((c) => {
            const shareUrl = `${publicBase}/r/${c.slug}`;
            const pngUrl = `/api/qr/${c.slug}.png`;
            const scans = scanByCampaign.get(c.id) ?? 0;
            const leads = leadByCampaign.get(c.id) ?? 0;
            const conv = scans > 0 ? `${Math.round((leads / scans) * 100)}%` : "—";
            return (
              <Card key={c.id} className={c.isActive ? "" : "opacity-60"}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{c.name}</CardTitle>
                    {!c.isActive ? (
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] uppercase tracking-wider">
                        {t("inactive")}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {c.employee
                      ? localized(locale, c.employee.nameEn ?? "", c.employee.nameAr ?? "")
                      : ""}
                    {c.product ? ` · ${localized(locale, c.product.nameEn, c.product.nameAr)}` : ""}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={pngUrl}
                      alt={c.slug}
                      width={120}
                      height={120}
                      className="rounded-md border bg-white p-1"
                    />
                    <div className="flex-1 space-y-1 text-xs">
                      <p className="break-all">
                        <span className="text-muted-foreground">{t("shareUrl")}: </span>
                        <a
                          className="text-brand-700 hover:underline"
                          href={shareUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {shareUrl}
                        </a>
                      </p>
                      <p>
                        <span className="text-muted-foreground">{t("scans")}: </span>
                        <strong>{scans}</strong>{" "}
                        <span className="text-muted-foreground">· {t("leads")}: </span>
                        <strong>{leads}</strong>{" "}
                        <span className="text-muted-foreground">· {t("conversion")}: </span>
                        <strong>{conv}</strong>
                      </p>
                      <p className="flex gap-3">
                        <a className="text-brand-700 hover:underline" href={pngUrl} download>
                          {t("downloadPng")}
                        </a>
                        {isAdmin ? (
                          <a className="text-brand-700 hover:underline" href={`/qr/${c.id}/edit`}>
                            {t("edit")}
                          </a>
                        ) : null}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
