import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Role } from "@prisma/client";
import { auth } from "@/lib/auth/config";
import { requireActor } from "@/lib/auth/session";
import { catalogService } from "@/server/services/catalog.service";
import { localized } from "@/lib/i18n/localized";
import type { AppLocale } from "@/lib/i18n/config";
import { ProvisionUserForm } from "@/components/portal/ProvisionUserForm";

export default async function NewUserPage() {
  const session = await auth();
  if (session?.user?.role !== Role.ADMIN) redirect("/dashboard");

  const actor = await requireActor();
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("admin.users");

  const businessLines = await catalogService.listBusinessLines(actor);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("new")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("newSubtitle")}</p>
        <div className="brand-underline mt-2 w-16" />
      </header>
      <ProvisionUserForm
        businessLines={businessLines.map((b) => ({
          id: b.id,
          name: localized(locale, b.nameEn, b.nameAr),
        }))}
      />
    </div>
  );
}
