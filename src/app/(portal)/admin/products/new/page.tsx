import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Company, Role } from "@prisma/client";
import { auth } from "@/lib/auth/config";
import { requireActor } from "@/lib/auth/session";
import { catalogService } from "@/server/services/catalog.service";
import { localized } from "@/lib/i18n/localized";
import { COMPANY_LABELS_AR, COMPANY_LABELS_EN } from "@/lib/catalog/company";
import type { AppLocale } from "@/lib/i18n/config";
import { ProductForm } from "@/components/portal/ProductForm";

export default async function NewProductPage() {
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
  const companyLabels = locale === "ar" ? COMPANY_LABELS_AR : COMPANY_LABELS_EN;

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
          enabledAttributes: c.enabledAttributes as never,
          requiredAttributes: c.requiredAttributes as never,
          attributes: c.attributes.map((ca) => ({
            id: ca.attribute.id,
            key: ca.attribute.key,
            nameEn: ca.attribute.nameEn,
            nameAr: ca.attribute.nameAr,
            type: ca.attribute.type,
            options:
              (
                ca.attribute.options as {
                  options?: { value: string; labelEn: string; labelAr: string }[];
                } | null
              )?.options ?? [],
          })),
        }))}
        companies={Object.values(Company).map((c) => ({
          value: c,
          label: companyLabels[c],
        }))}
        uploadsEnabled={!process.env.VERCEL}
      />
    </div>
  );
}
