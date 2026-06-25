import { notFound, redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Role } from "@prisma/client";
import { auth } from "@/lib/auth/config";
import { requireActor } from "@/lib/auth/session";
import { catalogService } from "@/server/services/catalog.service";
import { attributeRepository } from "@/server/repositories/attribute.repository";
import { localized } from "@/lib/i18n/localized";
import type { AppLocale } from "@/lib/i18n/config";
import { CategoryForm } from "@/components/portal/CategoryForm";

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const isAdmin = session?.user?.role === Role.ADMIN;
  const isBLOwner = session?.user?.role === Role.BUSINESS_LINE_OWNER;
  const hasCatalogFlag = session?.user?.canEditCatalog === true;
  if (!session?.user || (!isAdmin && !isBLOwner && !hasCatalogFlag)) {
    redirect("/dashboard");
  }

  const actor = await requireActor();
  const { id } = await params;
  const category = await catalogService.getCategory(actor, id);
  if (!category) notFound();

  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("admin.categories");
  const [businessLines, attributes] = await Promise.all([
    catalogService.listBusinessLines(actor),
    attributeRepository.listActive(),
  ]);

  // Just the picked attribute IDs — values live on each Product, not here.
  const pickedAttributeIds = (category.attributes ?? []).map((ca) => ca.attributeId);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("edit")}</h1>
        <div className="brand-underline mt-2 w-16" />
      </header>
      <CategoryForm
        businessLines={businessLines.map((b) => ({
          id: b.id,
          name: localized(locale, b.nameEn, b.nameAr),
        }))}
        availableAttributes={attributes.map((a) => ({
          id: a.id,
          key: a.key,
          nameEn: a.nameEn,
          nameAr: a.nameAr,
          type: a.type,
        }))}
        initial={{
          id: category.id,
          slug: category.slug,
          businessLineId: category.businessLineId,
          nameEn: category.nameEn,
          nameAr: category.nameAr,
          descriptionEn: category.descriptionEn,
          descriptionAr: category.descriptionAr,
          sortOrder: category.sortOrder,
          isActive: category.isActive,
          enabledAttributes: category.enabledAttributes,
          requiredAttributes: category.requiredAttributes,
          pickedAttributeIds,
        }}
      />
    </div>
  );
}
