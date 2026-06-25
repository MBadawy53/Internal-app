import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Role } from "@prisma/client";
import { auth } from "@/lib/auth/config";
import { attributeRepository } from "@/server/repositories/attribute.repository";
import { AttributeForm } from "@/components/portal/AttributeForm";
import type { AttributeOptionsJson } from "@/lib/catalog/attribute-values";

export default async function EditAttributePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== Role.ADMIN) redirect("/dashboard");

  const { id } = await params;
  const attribute = await attributeRepository.findById(id);
  if (!attribute) notFound();

  const t = await getTranslations("admin.attributes");
  const options = (attribute.options as AttributeOptionsJson | null)?.options ?? [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("edit")}</h1>
        <div className="brand-underline mt-2 w-16" />
      </header>
      <AttributeForm
        initial={{
          id: attribute.id,
          key: attribute.key,
          nameEn: attribute.nameEn,
          nameAr: attribute.nameAr,
          helpEn: attribute.helpEn,
          helpAr: attribute.helpAr,
          type: attribute.type,
          options,
          sortOrder: attribute.sortOrder,
          isActive: attribute.isActive,
        }}
      />
    </div>
  );
}
