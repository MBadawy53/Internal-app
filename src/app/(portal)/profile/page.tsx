import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { requireActor } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { localized } from "@/lib/i18n/localized";
import type { AppLocale } from "@/lib/i18n/config";
import { Card, CardContent } from "@/components/ui/card";
import { ProfileTabs } from "@/components/portal/ProfileTabs";

export default async function ProfilePage() {
  const actor = await requireActor();
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("profile");

  const user = await prisma.user.findUnique({
    where: { id: actor.id },
    select: {
      groupId: true,
      role: true,
      referralCode: true,
      nameEn: true,
      nameAr: true,
      email: true,
      phone: true,
      businessLine: { select: { nameEn: true, nameAr: true } },
    },
  });
  if (!user) notFound();

  const initial = {
    groupId: user.groupId ?? "",
    role: user.role,
    businessLine: user.businessLine
      ? localized(locale, user.businessLine.nameEn, user.businessLine.nameAr)
      : null,
    referralCode: user.referralCode,
    nameEn: user.nameEn ?? "",
    nameAr: user.nameAr ?? "",
    email: user.email ?? "",
    phone: user.phone ?? "",
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <div className="brand-underline mt-2 w-16" />
        <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>
      <Card>
        <CardContent className="pt-6">
          <ProfileTabs initial={initial} />
        </CardContent>
      </Card>
    </div>
  );
}
