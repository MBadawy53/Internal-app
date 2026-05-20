import { getTranslations } from "next-intl/server";
import { requireActor } from "@/lib/auth/session";
import { requireFeatureAccess } from "@/lib/auth/permissions";
import { Card, CardContent } from "@/components/ui/card";
import { SuggestionForm } from "@/components/portal/SuggestionForm";

export default async function NewSuggestionPage() {
  const actor = await requireActor();
  requireFeatureAccess(actor, "suggestions");
  const t = await getTranslations("suggestions");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("new")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>
        <div className="brand-underline mt-2 w-16" />
      </header>
      <Card>
        <CardContent className="pt-6">
          <SuggestionForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}
