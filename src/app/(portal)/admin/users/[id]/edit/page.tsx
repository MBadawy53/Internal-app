import { notFound, redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Role } from "@prisma/client";
import { auth } from "@/lib/auth/config";
import { requireActor } from "@/lib/auth/session";
import { catalogService } from "@/server/services/catalog.service";
import { userAdminRepository } from "@/server/repositories/userAdmin.repository";
import { localized } from "@/lib/i18n/localized";
import type { AppLocale } from "@/lib/i18n/config";
import { EditUserForm } from "@/components/portal/EditUserForm";

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user?.role !== Role.ADMIN) redirect("/dashboard");

  const actor = await requireActor();
  const { id } = await params;
  const user = await userAdminRepository.list().then((all) => all.find((u) => u.id === id));
  if (!user) notFound();

  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("admin.users");
  const businessLines = await catalogService.listBusinessLines(actor);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("edit")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {user.nameEn ?? user.email ?? user.groupId}
        </p>
        <div className="brand-underline mt-2 w-16" />
      </header>
      <EditUserForm
        userId={user.id}
        groupId={user.groupId}
        initial={{
          role: user.role,
          businessLineId: user.businessLineId,
          managerId: user.managerId,
          canEditProducts: user.canEditProducts,
          canEditCatalog: user.canEditCatalog,
        }}
        businessLines={businessLines.map((b) => ({
          id: b.id,
          name: localized(locale, b.nameEn, b.nameAr),
        }))}
      />
    </div>
  );
}
