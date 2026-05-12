import { getTranslations } from "next-intl/server";
import { requireActor } from "@/lib/auth/session";
import { Card, CardContent } from "@/components/ui/card";
import { ProfileTabs } from "@/components/portal/ProfileTabs";

export default async function ProfilePage() {
  await requireActor();
  const t = await getTranslations("profile");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <div className="brand-underline mt-2 w-16" />
        <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>
      <Card>
        <CardContent className="pt-6">
          <ProfileTabs />
        </CardContent>
      </Card>
    </div>
  );
}
