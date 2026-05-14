import { notFound, redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Role } from "@prisma/client";
import { requireActor } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { announcementRepository } from "@/server/repositories/announcement.repository";
import { localized } from "@/lib/i18n/localized";
import type { AppLocale } from "@/lib/i18n/config";
import { Card, CardContent } from "@/components/ui/card";
import { AnnouncementForm } from "@/components/portal/AnnouncementForm";

interface Params {
  params: Promise<{ id: string }>;
}

export default async function EditAnnouncementPage({ params }: Params) {
  const actor = await requireActor();
  if (actor.role !== Role.ADMIN) redirect("/dashboard");
  const { id } = await params;
  const a = await announcementRepository.findById(id);
  if (!a) notFound();
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
        <h1 className="text-2xl font-semibold tracking-tight">{t("edit")}</h1>
        <div className="brand-underline mt-2 w-16" />
        <p className="mt-1 text-sm text-muted-foreground">
          {localized(locale, a.titleEn, a.titleAr)}
        </p>
      </header>
      <Card>
        <CardContent className="pt-6">
          <AnnouncementForm
            businessLines={bls.map((b) => ({
              id: b.id,
              name: localized(locale, b.nameEn, b.nameAr),
            }))}
            initial={{
              id: a.id,
              titleEn: a.titleEn,
              titleAr: a.titleAr,
              bodyEn: a.bodyEn,
              bodyAr: a.bodyAr,
              imageUrl: a.imageUrl,
              targetRoles: a.targetRoles,
              targetBusinessLineIds: a.targetBusinessLineIds,
              startsAt: a.startsAt,
              endsAt: a.endsAt,
              isActive: a.isActive,
              pushNotificationSent: a.pushNotificationSent,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
