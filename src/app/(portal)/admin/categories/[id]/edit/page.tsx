import { notFound, redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Role } from "@prisma/client";
import { auth } from "@/lib/auth/config";
import { requireActor } from "@/lib/auth/session";
import { catalogService } from "@/server/services/catalog.service";
import { localized } from "@/lib/i18n/localized";
import type { AppLocale } from "@/lib/i18n/config";
import { CategoryForm } from "@/components/portal/CategoryForm";

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== Role.ADMIN && session?.user?.role !== Role.BUSINESS_LINE_OWNER) {
    redirect("/dashboard");
  }

  const actor = await requireActor();
  const { id } = await params;
  const category = await catalogService.getCategory(actor, id);
  if (!category) notFound();

  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("admin.categories");
  const businessLines = await catalogService.listBusinessLines(actor);

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
        }}
      />
    </div>
  );
}
