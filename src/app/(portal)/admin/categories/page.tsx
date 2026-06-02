import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Role } from "@prisma/client";
import { auth } from "@/lib/auth/config";
import { requireActor } from "@/lib/auth/session";
import { catalogService } from "@/server/services/catalog.service";
import { localized } from "@/lib/i18n/localized";
import type { AppLocale } from "@/lib/i18n/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteButton } from "@/components/portal/DeleteButton";
import { CategoriesBulkPanel } from "@/components/portal/CategoriesBulkPanel";
import { deleteCategorySafeAction } from "@/server/actions/categories";

export default async function AdminCategoriesPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === Role.ADMIN;
  const isBLOwner = session?.user?.role === Role.BUSINESS_LINE_OWNER;
  const hasCatalogFlag = session?.user?.canEditCatalog === true;
  if (!session?.user || (!isAdmin && !isBLOwner && !hasCatalogFlag)) {
    redirect("/dashboard");
  }

  const actor = await requireActor();
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("admin.categories");

  const categories = await catalogService.listCategories(actor, { includeInactive: true });

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button asChild>
          <Link href="/admin/categories/new">{t("new")}</Link>
        </Button>
      </header>

      {isAdmin ? <CategoriesBulkPanel /> : null}

      {categories.length === 0 ? (
        <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          {t("empty")}
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <Card key={c.id}>
              <CardHeader>
                <CardTitle>{localized(locale, c.nameEn, c.nameAr)}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {localized(locale, c.businessLine.nameEn, c.businessLine.nameAr)}
                </p>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                    c.isActive ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {c.isActive ? "active" : "inactive"}
                </span>
                <div className="flex items-center gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/admin/categories/${c.id}/edit`}>edit</Link>
                  </Button>
                  <DeleteButton action={deleteCategorySafeAction.bind(null, c.id)} iconOnly />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
