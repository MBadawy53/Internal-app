import { getLocale, getTranslations } from "next-intl/server";
import { requireActor } from "@/lib/auth/session";
import { catalogService } from "@/server/services/catalog.service";
import { localized } from "@/lib/i18n/localized";
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
    cflat?: string;
  }>;
}) {
  const actor = await requireActor();
  const sp = await searchParams;
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("calculator");

  const products = await catalogService.listProducts(actor);

  // Trim products to a calculator-safe shape — convert BigInts to strings before
  // sending to the client component (Next.js cannot serialize BigInts to RSC payloads).
  const productsForClient = products.map((p) => ({
    id: p.id,
    name: localized(locale, p.nameEn, p.nameAr),
    businessLineName: localized(locale, p.businessLine.nameEn, p.businessLine.nameAr),
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
    earlySettlementFeeBps: p.earlySettlementFeeBps,
    latePaymentFeeBps: p.latePaymentFeeBps,
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
        locale={locale}
        initial={{
          productId: sp.productId,
          principal: sp.principal,
          tenure: sp.tenure,
          invoice: sp.invoice,
          dpPercent: sp.dp,
          customerFlat: sp.cflat,
        }}
      />
    </div>
  );
}
