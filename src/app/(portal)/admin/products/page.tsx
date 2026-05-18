import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Role } from "@prisma/client";
import { auth } from "@/lib/auth/config";
import { requireActor } from "@/lib/auth/session";
import { catalogService } from "@/server/services/catalog.service";
import { localized } from "@/lib/i18n/localized";
import { formatBps, formatMoney } from "@/lib/finance/money";
import type { AppLocale } from "@/lib/i18n/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductsBulkPanel } from "@/components/portal/ProductsBulkPanel";

export default async function AdminProductsPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === Role.ADMIN;
  const isBLOwner = session?.user?.role === Role.BUSINESS_LINE_OWNER;
  const hasProductFlag = session?.user?.canEditProducts === true;
  if (!session?.user || (!isAdmin && !isBLOwner && !hasProductFlag)) {
    redirect("/dashboard");
  }

  const actor = await requireActor();
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("admin.products");
  const tCommon = await getTranslations("common");

  const products = await catalogService.listProducts(actor, { includeInactive: true });

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">{t("new")}</Link>
        </Button>
      </header>

      {isAdmin ? <ProductsBulkPanel /> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {products.map((p) => (
          <Card key={p.id}>
            <CardHeader>
              <p className="text-xs uppercase tracking-wide text-brand-700">
                {localized(locale, p.businessLine.nameEn, p.businessLine.nameAr)} ·{" "}
                {localized(locale, p.category.nameEn, p.category.nameAr)}
              </p>
              <CardTitle>{localized(locale, p.nameEn, p.nameAr)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">amount</p>
                  <p className="font-medium">
                    {formatMoney(p.amountMinPiastres, locale)} —{" "}
                    {formatMoney(p.amountMaxPiastres, locale)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">flat / declining</p>
                  <p className="font-medium">
                    {formatBps(p.flatInterestRateBps, locale)} /{" "}
                    {formatBps(p.decliningInterestRateBps, locale)}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                    p.isActive ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {p.isActive ? "active" : "inactive"}
                </span>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/admin/products/${p.id}/edit`}>{tCommon("edit")}</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
