import { getLocale, getTranslations } from "next-intl/server";
import { Company } from "@prisma/client";
import { requireActor } from "@/lib/auth/session";
import { requireFeatureAccess } from "@/lib/auth/permissions";
import { isFeatureVisible } from "@/lib/auth/rbac";
import { catalogService } from "@/server/services/catalog.service";
import { localized } from "@/lib/i18n/localized";
import { COMPANY_LABELS_AR, COMPANY_LABELS_EN } from "@/lib/catalog/company";
import type { AppLocale } from "@/lib/i18n/config";
import { CalculatorClient } from "@/components/portal/CalculatorClient";

export default async function CalculatorPage({
  searchParams,
}: {
  searchParams: Promise<{
    productId?: string;
    principal?: string;
    tenure?: string;
    invoice?: string;
    dp?: string;
  }>;
}) {
  const actor = await requireActor();
  requireFeatureAccess(actor, "calculator");
  const sp = await searchParams;
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("calculator");

  const [products, businessLines, categories] = await Promise.all([
    catalogService.listProducts(actor),
    catalogService.listBusinessLines(actor),
    catalogService.listCategories(actor),
  ]);

  const companyLabels = locale === "ar" ? COMPANY_LABELS_AR : COMPANY_LABELS_EN;

  // Trim products to a calculator-safe shape — convert BigInts to strings before
  // sending to the client component (Next.js cannot serialize BigInts to RSC payloads).
  const productsForClient = products.map((p) => ({
    id: p.id,
    name: localized(locale, p.nameEn, p.nameAr),
    businessLineId: p.businessLineId,
    businessLineName: localized(locale, p.businessLine.nameEn, p.businessLine.nameAr),
    categoryId: p.categoryId,
    categoryName: localized(locale, p.category.nameEn, p.category.nameAr),
    company: p.company,
    amountMinPiastres: p.amountMinPiastres.toString(),
    amountMaxPiastres: p.amountMaxPiastres.toString(),
    tenureMinMonths: p.tenureMinMonths,
    tenureMaxMonths: p.tenureMaxMonths,
    flatInterestRateBps: p.flatInterestRateBps,
    decliningInterestRateBps: p.decliningInterestRateBps,
    adminFeeBps: p.adminFeeBps,
    adminFeeMinPiastres: p.adminFeeMinPiastres.toString(),
    adminFeeMaxPiastres: p.adminFeeMaxPiastres.toString(),
    insuranceRequired: p.insuranceRequired,
    minDownPaymentBps: p.minDownPaymentBps,
    earlySettlementFeeBps: p.earlySettlementFeeBps,
    latePaymentFeeBps: p.latePaymentFeeBps,
    installmentPeriod: p.installmentPeriod,
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <div className="brand-underline mt-2 w-16" />
        <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <CalculatorClient
        products={productsForClient}
        businessLines={businessLines.map((b) => ({
          id: b.id,
          name: localized(locale, b.nameEn, b.nameAr),
        }))}
        categories={categories.map((c) => ({
          id: c.id,
          name: localized(locale, c.nameEn, c.nameAr),
          businessLineId: c.businessLineId,
        }))}
        companies={Object.values(Company).map((c) => ({
          value: c,
          label: companyLabels[c],
        }))}
        locale={locale}
        allowProductMode={isFeatureVisible(actor.role, "calculatorProduct")}
        allowAffordabilityMode={isFeatureVisible(actor.role, "calculatorAffordability")}
        initial={{
          productId: sp.productId,
          principal: sp.principal,
          tenure: sp.tenure,
          invoice: sp.invoice,
          dpPercent: sp.dp,
        }}
      />
    </div>
  );
}
