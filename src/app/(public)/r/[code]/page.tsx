import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
import { QrCampaignKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { qrCampaignRepository } from "@/server/repositories/qrCampaign.repository";
import { localized } from "@/lib/i18n/localized";
import type { AppLocale } from "@/lib/i18n/config";
import { formatBps, formatMoney } from "@/lib/finance/money";
import { renderSafeMarkdown } from "@/lib/markdown";
import { Logo } from "@/components/shared/Logo";
import { LocaleToggle } from "@/components/portal/LocaleToggle";
import { PublicLeadForm } from "@/components/portal/PublicLeadForm";
import { AmbassadorSignupForm } from "@/components/portal/AmbassadorSignupForm";

interface Params {
  params: Promise<{ code: string }>;
}

export default async function PublicReferralPage({ params }: Params) {
  const { code } = await params;
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("public.leadCapture");
  const tCatalog = await getTranslations("catalog.detail");

  // Resolve code: campaign slug first, then user referral code.
  const campaign = await qrCampaignRepository.findActiveBySlug(code);
  let employee: { id: string; nameEn: string | null; nameAr: string | null } | null = null;
  let product: {
    id: string;
    nameEn: string;
    nameAr: string;
    shortDescEn: string;
    shortDescAr: string;
    amountMinPiastres: bigint;
    amountMaxPiastres: bigint;
    tenureMinMonths: number;
    tenureMaxMonths: number;
    decliningInterestRateBps: number;
  } | null = null;

  if (campaign) {
    employee = {
      id: campaign.employee.id,
      nameEn: campaign.employee.nameEn,
      nameAr: campaign.employee.nameAr,
    };
    if (campaign.product) {
      product = {
        id: campaign.product.id,
        nameEn: campaign.product.nameEn,
        nameAr: campaign.product.nameAr,
        shortDescEn: campaign.product.shortDescEn,
        shortDescAr: campaign.product.shortDescAr,
        amountMinPiastres: campaign.product.amountMinPiastres,
        amountMaxPiastres: campaign.product.amountMaxPiastres,
        tenureMinMonths: campaign.product.tenureMinMonths,
        tenureMaxMonths: campaign.product.tenureMaxMonths,
        decliningInterestRateBps: campaign.product.decliningInterestRateBps,
      };
    }
  } else {
    const emp = await prisma.user.findUnique({
      where: { referralCode: code },
      select: { id: true, nameEn: true, nameAr: true, isActive: true },
    });
    if (!emp || !emp.isActive) notFound();
    employee = { id: emp.id, nameEn: emp.nameEn, nameAr: emp.nameAr };
  }

  // Record the scan. Fire-and-forget; never block the page on it.
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? undefined;
  const userAgent = h.get("user-agent") ?? undefined;
  const referer = h.get("referer") ?? undefined;
  qrCampaignRepository
    .recordScan({
      campaignId: campaign?.id ?? null,
      referralCode: code,
      ip,
      userAgent,
      referer,
    })
    .catch(() => undefined);

  // Per-campaign customisation (locale-aware).
  const customTitle = campaign
    ? localized(locale, campaign.titleEn ?? "", campaign.titleAr ?? "")
    : "";
  const customSubtitle = campaign
    ? localized(locale, campaign.subtitleEn ?? "", campaign.subtitleAr ?? "")
    : "";
  const bodyHtml = renderSafeMarkdown(
    campaign ? (locale === "ar" ? campaign.bodyMdAr : campaign.bodyMdEn) : "",
  );

  return (
    <main className="flex min-h-screen flex-col items-center bg-muted/30 p-6">
      <div className="flex w-full max-w-lg flex-col items-center gap-6 py-6">
        <div className="flex w-full items-center justify-between">
          <Logo withTagline />
          <LocaleToggle />
        </div>

        <div className="w-full overflow-hidden rounded-lg border bg-card shadow-soft">
          {campaign?.headerImageUrl ? (
            <div className="relative aspect-[2/1] w-full bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={campaign.headerImageUrl}
                alt=""
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : null}

          <div className="space-y-4 p-6">
            <header className="text-center">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                {t("referredBy")}
              </p>
              <p className="mt-1 text-base font-semibold">
                {employee ? localized(locale, employee.nameEn ?? "", employee.nameAr ?? "") : ""}
              </p>
              {customTitle ? <h1 className="mt-3 text-xl font-semibold">{customTitle}</h1> : null}
              {customSubtitle ? (
                <p className="mt-1 text-sm text-muted-foreground">{customSubtitle}</p>
              ) : campaign && !customTitle ? (
                <p className="mt-2 text-xs text-muted-foreground">{campaign.name}</p>
              ) : null}
            </header>

            {bodyHtml ? (
              <div
                className="prose prose-sm max-w-none text-foreground"
                // bodyHtml comes from renderSafeMarkdown which disables raw
                // HTML, escapes input, and constrains link schemes.
                dangerouslySetInnerHTML={{ __html: bodyHtml }}
              />
            ) : null}

            {product ? (
              <div className="rounded-md border bg-secondary/30 p-3 text-sm">
                <p className="font-medium">{localized(locale, product.nameEn, product.nameAr)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {localized(locale, product.shortDescEn, product.shortDescAr)}
                </p>
                <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <dt className="text-muted-foreground">{tCatalog("amountRange")}</dt>
                    <dd className="font-medium">
                      {formatMoney(product.amountMinPiastres, locale)}
                    </dd>
                    <dd className="text-muted-foreground">
                      — {formatMoney(product.amountMaxPiastres, locale)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">{tCatalog("tenureRange")}</dt>
                    <dd className="font-medium">
                      {product.tenureMinMonths}–{product.tenureMaxMonths}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">{tCatalog("decliningRate")}</dt>
                    <dd className="font-medium">
                      {formatBps(product.decliningInterestRateBps, locale)}
                    </dd>
                  </div>
                </dl>
              </div>
            ) : null}

            {!bodyHtml ? <p className="text-sm text-muted-foreground">{t("intro")}</p> : null}

            {campaign?.kind === QrCampaignKind.AMBASSADOR_INVITE ? (
              <AmbassadorSignupForm code={code} />
            ) : (
              <PublicLeadForm code={code} />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
