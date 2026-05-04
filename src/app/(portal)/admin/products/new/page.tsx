import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { ProductType, Role } from "@prisma/client";
import { auth } from "@/lib/auth/config";
import { requireActor } from "@/lib/auth/session";
import { catalogService } from "@/server/services/catalog.service";
import { localized } from "@/lib/i18n/localized";
import type { AppLocale } from "@/lib/i18n/config";
import { ProductForm } from "@/components/portal/ProductForm";

export default async function NewProductPage() {
  const session = await auth();
  if (session?.user?.role !== Role.ADMIN && session?.user?.role !== Role.BUSINESS_LINE_OWNER) {
    redirect("/dashboard");
  }

  const actor = await requireActor();
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("admin.products");
  const tTypes = await getTranslations("productTypes");

  const [businessLines, categories] = await Promise.all([
    catalogService.listBusinessLines(actor),
    catalogService.listCategories(actor),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("new")}</h1>
        <div className="brand-underline mt-2 w-16" />
      </header>
      <ProductForm
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
      />
    </div>
  );
}
