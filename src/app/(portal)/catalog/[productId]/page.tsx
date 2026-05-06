import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { requireActor } from "@/lib/auth/session";
import { catalogService } from "@/server/services/catalog.service";
import { localized } from "@/lib/i18n/localized";
import { formatBps, formatMoney } from "@/lib/finance/money";
import type { AppLocale } from "@/lib/i18n/config";
import { makeAttributeConfig } from "@/lib/catalog/attributes";
import { formatAttributeValue } from "@/lib/catalog/attribute-values";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Params {
  params: Promise<{ productId: string }>;
}

export default async function ProductDetailPage({ params }: Params) {
  const actor = await requireActor();
  const { productId } = await params;
  const product = await catalogService.getProduct(actor, productId);
  if (!product) notFound();

  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("catalog.detail");
  const tCommon = await getTranslations("common");
  const tTypes = await getTranslations("productTypes");

  const name = localized(locale, product.nameEn, product.nameAr);
  const longDesc = localized(locale, product.longDescEn, product.longDescAr);
  const blName = localized(locale, product.businessLine.nameEn, product.businessLine.nameAr);
  const catName = localized(locale, product.category.nameEn, product.category.nameAr);
  const eligibility = localized(locale, product.eligibilityEn, product.eligibilityAr);
  const documents = locale === "ar" ? product.documentsAr : product.documentsEn;
  const attrConfig = makeAttributeConfig(
    product.category.enabledAttributes,
    product.category.requiredAttributes,
  );

  const adminFeeFormula = t("adminFeeFormula", {
    pct: formatBps(product.adminFeeBps, locale),
    min: formatMoney(product.adminFeeMinPiastres, locale),
    max: formatMoney(product.adminFeeMaxPiastres, locale),
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-brand-700">
            {blName} · {catName}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{name}</h1>
          <div className="brand-underline mt-2 w-16" />
          <p className="mt-1 text-sm text-muted-foreground">{tTypes(product.type)}</p>
        </div>
        <Button asChild>
          <Link href={`/calculator?productId=${product.id}`}>{t("openCalculator")}</Link>
        </Button>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed text-foreground">{longDesc}</p>
            {attrConfig.enabled.has("eligibility") && eligibility ? (
              <div>
                <h3 className="text-sm font-semibold">{t("eligibility")}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{eligibility}</p>
              </div>
            ) : null}
            {attrConfig.enabled.has("documents") && documents.length > 0 ? (
              <div>
                <h3 className="text-sm font-semibold">{t("documents")}</h3>
                <ul className="mt-1 list-inside list-disc text-sm text-muted-foreground">
                  {documents.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {product.attributeValues.length > 0 ? (
              <div>
                <h3 className="text-sm font-semibold">{t("variables")}</h3>
                <dl className="mt-2 grid gap-3 sm:grid-cols-2">
                  {product.attributeValues.map((av) => (
                    <div key={av.id} className="rounded-md border bg-secondary/40 p-3">
                      <dt className="text-sm font-medium">
                        {localized(locale, av.attribute.nameEn, av.attribute.nameAr)}
                      </dt>
                      <dd className="mt-1 text-xs text-muted-foreground">
                        {formatAttributeValue(av.attribute, av.value, locale)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{tCommon("view")}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              {attrConfig.enabled.has("amountRange") ? (
                <div>
                  <dt className="text-muted-foreground">{t("amountRange")}</dt>
                  <dd className="font-medium">
                    {formatMoney(product.amountMinPiastres, locale)} —{" "}
                    {formatMoney(product.amountMaxPiastres, locale)}
                  </dd>
                </div>
              ) : null}
              {attrConfig.enabled.has("tenureRange") ? (
                <div>
                  <dt className="text-muted-foreground">{t("tenureRange")}</dt>
                  <dd className="font-medium">
                    {product.tenureMinMonths}–{product.tenureMaxMonths}
                  </dd>
                </div>
              ) : null}
              {attrConfig.enabled.has("flatRate") ? (
                <div>
                  <dt className="text-muted-foreground">{t("flatRate")}</dt>
                  <dd className="font-medium">{formatBps(product.flatInterestRateBps, locale)}</dd>
                </div>
              ) : null}
              {attrConfig.enabled.has("decliningRate") ? (
                <div>
                  <dt className="text-muted-foreground">{t("decliningRate")}</dt>
                  <dd className="font-medium">
                    {formatBps(product.decliningInterestRateBps, locale)}
                  </dd>
                </div>
              ) : null}
              {attrConfig.enabled.has("adminFee") ? (
                <div>
                  <dt className="text-muted-foreground">{t("adminFee")}</dt>
                  <dd className="font-medium">{adminFeeFormula}</dd>
                </div>
              ) : null}
              {attrConfig.enabled.has("insurance") ? (
                <div>
                  <dt className="text-muted-foreground">{t("insurance")}</dt>
                  <dd className="font-medium">
                    {product.insuranceRequired ? t("insuranceRequired") : t("insuranceOptional")}
                  </dd>
                </div>
              ) : null}
              {attrConfig.enabled.has("earlySettlement") ? (
                <div>
                  <dt className="text-muted-foreground">{t("earlySettlementFee")}</dt>
                  <dd className="font-medium">
                    {formatBps(product.earlySettlementFeeBps, locale)}
                  </dd>
                </div>
              ) : null}
              {attrConfig.enabled.has("latePayment") ? (
                <div>
                  <dt className="text-muted-foreground">{t("latePaymentFee")}</dt>
                  <dd className="font-medium">{formatBps(product.latePaymentFeeBps, locale)}</dd>
                </div>
              ) : null}
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
