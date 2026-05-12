import { getLocale, getTranslations } from "next-intl/server";
import { Role } from "@prisma/client";
import { requireActor } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { qrCampaignRepository } from "@/server/repositories/qrCampaign.repository";
import { qrLandingTemplateRepository } from "@/server/repositories/qrLandingTemplate.repository";
import { catalogService } from "@/server/services/catalog.service";
import { localized } from "@/lib/i18n/localized";
import type { AppLocale } from "@/lib/i18n/config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QrCampaignForm } from "@/components/portal/QrCampaignForm";

export default async function QrPage() {
  const actor = await requireActor();
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("qr");

  const campaigns = await qrCampaignRepository.listForActor({
    id: actor.id,
    role: actor.role,
    businessLineId: actor.businessLineId,
  });

  const canCreate = actor.role === Role.ADMIN || actor.role === Role.BUSINESS_LINE_OWNER;

  let employees: { id: string; name: string; businessLineId?: string }[] = [];
  let products: { id: string; name: string; businessLineId: string }[] = [];
  let templates: Awaited<ReturnType<typeof qrLandingTemplateRepository.list>> = [];
  if (canCreate) {
    templates = await qrLandingTemplateRepository.list();
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
    employees = emps.map((e) => ({
      id: e.id,
      name: localized(locale, e.nameEn ?? "", e.nameAr ?? ""),
      businessLineId: e.businessLineId ?? undefined,
    }));
    // Make sure the actor is selectable so we can pre-fill the owner — admins
    // aren't in the employee role filter above. They can still hand-pick a
    // proper employee from the dropdown.
    if (!employees.some((e) => e.id === actor.id)) {
      const me = await prisma.user.findUnique({
        where: { id: actor.id },
        select: { nameEn: true, nameAr: true, businessLineId: true },
      });
      if (me) {
        employees.unshift({
          id: actor.id,
          name: `${localized(locale, me.nameEn ?? "", me.nameAr ?? "")} (me)`,
          businessLineId: me.businessLineId ?? undefined,
        });
      }
    }
    const prods = await catalogService.listProducts(actor);
    products = prods.map((p) => ({
      id: p.id,
      name: localized(locale, p.nameEn, p.nameAr),
      businessLineId: p.businessLineId,
    }));
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

      {canCreate ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("newCampaign")}</CardTitle>
          </CardHeader>
          <CardContent>
            <QrCampaignForm
              employees={employees}
              products={products}
              templates={templates}
              initial={{ employeeId: actor.id }}
            />
          </CardContent>
        </Card>
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
            const conv =
              c.scanCount > 0 ? `${Math.round((c.leadCount / c.scanCount) * 100)}%` : "—";
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
                        <strong>{c.scanCount}</strong>{" "}
                        <span className="text-muted-foreground">· {t("leads")}: </span>
                        <strong>{c.leadCount}</strong>{" "}
                        <span className="text-muted-foreground">· {t("conversion")}: </span>
                        <strong>{conv}</strong>
                      </p>
                      <p className="flex gap-3">
                        <a className="text-brand-700 hover:underline" href={pngUrl} download>
                          {t("downloadPng")}
                        </a>
                        {canCreate ? (
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
