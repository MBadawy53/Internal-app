import { notFound, redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { ProductType, Role } from "@prisma/client";
import { auth } from "@/lib/auth/config";
import { requireActor } from "@/lib/auth/session";
import { catalogService } from "@/server/services/catalog.service";
import { localized } from "@/lib/i18n/localized";
import type { AppLocale } from "@/lib/i18n/config";
import { ProductForm } from "@/components/portal/ProductForm";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== Role.ADMIN && session?.user?.role !== Role.BUSINESS_LINE_OWNER) {
    redirect("/dashboard");
  }

  const actor = await requireActor();
  const { id } = await params;
  const product = await catalogService.getProduct(actor, id);
  if (!product) notFound();

  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("admin.products");
  const tTypes = await getTranslations("productTypes");

  const [businessLines, categories] = await Promise.all([
    catalogService.listBusinessLines(actor),
    catalogService.listCategories(actor, { includeInactive: true }),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("edit")}</h1>
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
        initial={{
          id: product.id,
          businessLineId: product.businessLineId,
          categoryId: product.categoryId,
          type: product.type,
          nameEn: product.nameEn,
          nameAr: product.nameAr,
          shortDescEn: product.shortDescEn,
          shortDescAr: product.shortDescAr,
          longDescEn: product.longDescEn,
          longDescAr: product.longDescAr,
          eligibilityEn: product.eligibilityEn,
          eligibilityAr: product.eligibilityAr,
          documentsEn: product.documentsEn,
          documentsAr: product.documentsAr,
          amountMinEgp: Number(product.amountMinPiastres) / 100,
          amountMaxEgp: Number(product.amountMaxPiastres) / 100,
          tenureMinMonths: product.tenureMinMonths,
          tenureMaxMonths: product.tenureMaxMonths,
          flatInterestRateBps: product.flatInterestRateBps,
          decliningInterestRateBps: product.decliningInterestRateBps,
          adminFeeBps: product.adminFeeBps,
          adminFeeMinEgp: Number(product.adminFeeMinPiastres) / 100,
          adminFeeMaxEgp: Number(product.adminFeeMaxPiastres) / 100,
          insuranceRequired: product.insuranceRequired,
          earlySettlementFeeBps: product.earlySettlementFeeBps,
          latePaymentFeeBps: product.latePaymentFeeBps,
          heroImageUrl: product.heroImageUrl,
          isFeatured: product.isFeatured,
          isActive: product.isActive,
          variables: product.variables.map((v) => ({
            nameEn: v.nameEn,
            nameAr: v.nameAr,
            descriptionEn: v.descriptionEn,
            descriptionAr: v.descriptionAr,
          })),
        }}
      />
    </div>
  );
}
