import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { ProductType } from "@prisma/client";
import { requireActor } from "@/lib/auth/session";
import { catalogService } from "@/server/services/catalog.service";
import { localized } from "@/lib/i18n/localized";
import { formatBps, formatMoney } from "@/lib/finance/money";
import type { AppLocale } from "@/lib/i18n/config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CatalogFilters } from "@/components/portal/CatalogFilters";

interface SearchParams {
  bl?: string;
  cat?: string;
  type?: string;
  q?: string;
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const actor = await requireActor();
  const sp = await searchParams;
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("catalog");
  const tTypes = await getTranslations("productTypes");

  const [businessLines, categories, products] = await Promise.all([
    catalogService.listBusinessLines(actor),
    catalogService.listCategories(actor, sp.bl ? { businessLineId: sp.bl } : {}),
    catalogService.listProducts(actor, {
      businessLineId: sp.bl || undefined,
      categoryId: sp.cat || undefined,
      type: (sp.type as ProductType | undefined) || undefined,
      query: sp.q || undefined,
    }),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <div className="brand-underline mt-2 w-16" />
        <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <CatalogFilters
        businessLines={businessLines.map((b) => ({
          id: b.id,
          name: localized(locale, b.nameEn, b.nameAr),
        }))}
        categories={categories.map((c) => ({
          id: c.id,
          name: localized(locale, c.nameEn, c.nameAr),
          businessLineId: c.businessLineId,
        }))}
        productTypes={Object.values(ProductType).map((pt) => ({
          value: pt,
          label: tTypes(pt),
        }))}
        initial={sp}
      />

      {products.length === 0 ? (
        <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          {t("empty")}
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {products.map((p) => {
            const name = localized(locale, p.nameEn, p.nameAr);
            const blName = localized(locale, p.businessLine.nameEn, p.businessLine.nameAr);
            const catName = localized(locale, p.category.nameEn, p.category.nameAr);
            const shortDesc = localized(locale, p.shortDescEn, p.shortDescAr);
            return (
              <Card key={p.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium uppercase tracking-wide text-brand-700">
                      {blName}
                    </span>
                    {p.isFeatured ? (
                      <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-700">
                        ★
                      </span>
                    ) : null}
                  </div>
                  <CardTitle>{name}</CardTitle>
                  <p className="text-xs text-muted-foreground">{catName}</p>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-3">
                  <p className="line-clamp-2 text-sm text-muted-foreground">{shortDesc}</p>
                  <dl className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <dt className="text-muted-foreground">{t("card.amount")}</dt>
                      <dd className="font-medium">{formatMoney(p.amountMinPiastres, locale)}</dd>
                      <dd className="text-muted-foreground">
                        — {formatMoney(p.amountMaxPiastres, locale)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">{t("card.tenure")}</dt>
                      <dd className="font-medium">
                        {p.tenureMinMonths}–{p.tenureMaxMonths} {t("monthsUnit")}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">{t("card.rate")}</dt>
                      <dd className="font-medium">{formatBps(p.flatInterestRateBps, locale)}</dd>
                    </div>
                  </dl>
                  <div className="mt-auto flex gap-2 pt-3">
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <Link href={`/catalog/${p.id}`}>{t("card.viewDetails")}</Link>
                    </Button>
                    <Button asChild variant="default" size="sm" className="flex-1">
                      <Link href={`/calculator?productId=${p.id}`}>{t("card.calculate")}</Link>
                    </Button>
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
