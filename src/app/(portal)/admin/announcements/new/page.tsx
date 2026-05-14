import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Role } from "@prisma/client";
import { requireActor } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { localized } from "@/lib/i18n/localized";
import type { AppLocale } from "@/lib/i18n/config";
import { Card, CardContent } from "@/components/ui/card";
import { AnnouncementForm } from "@/components/portal/AnnouncementForm";

export default async function NewAnnouncementPage() {
  const actor = await requireActor();
  if (actor.role !== Role.ADMIN) redirect("/dashboard");
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("admin.announcements");

  const bls = await prisma.businessLine.findMany({
    where: { isActive: true },
    select: { id: true, nameEn: true, nameAr: true },
    orderBy: { nameEn: "asc" },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("new")}</h1>
        <div className="brand-underline mt-2 w-16" />
      </header>
      <Card>
        <CardContent className="pt-6">
          <AnnouncementForm
            businessLines={bls.map((b) => ({
              id: b.id,
              name: localized(locale, b.nameEn, b.nameAr),
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
