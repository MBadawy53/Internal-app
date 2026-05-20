import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { Role, type SuggestionStatus } from "@prisma/client";
import { requireActor } from "@/lib/auth/session";
import { requireFeatureAccess } from "@/lib/auth/permissions";
import { suggestionRepository } from "@/server/repositories/suggestion.repository";
import { localized } from "@/lib/i18n/localized";
import type { AppLocale } from "@/lib/i18n/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const STATUS_TONE: Record<SuggestionStatus, string> = {
  NEW: "bg-secondary text-secondary-foreground",
  UNDER_REVIEW: "bg-amber-50 text-amber-800",
  ACCEPTED: "bg-emerald-50 text-emerald-700",
  IMPLEMENTED: "bg-brand-50 text-brand-700",
  REJECTED: "bg-muted text-muted-foreground",
};

export default async function SuggestionsListPage() {
  const actor = await requireActor();
  requireFeatureAccess(actor, "suggestions");
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("suggestions");
  const tStatus = await getTranslations("suggestions.statuses");
  const tCat = await getTranslations("suggestions.categories");

  const isAdmin = actor.role === Role.ADMIN;
  const items = await suggestionRepository.list({
    submitterId: isAdmin ? undefined : actor.id,
    limit: 200,
  });
  const dateFmt = (d: Date) => new Date(d).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-EG");

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <div className="brand-underline mt-2 w-16" />
          <p className="mt-2 text-sm text-muted-foreground">
            {isAdmin ? t("subtitleAdmin") : t("subtitle")}
          </p>
        </div>
        <Button asChild>
          <Link href="/suggestions/new">{t("new")}</Link>
        </Button>
      </header>

      {items.length === 0 ? (
        <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          {t("empty")}
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((s) => {
            const submitter = s.submitter
              ? localized(locale, s.submitter.nameEn ?? "", s.submitter.nameAr ?? "")
              : "";
            return (
              <Link key={s.id} href={`/suggestions/${s.id}`} className="block">
                <Card className="transition-shadow hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">{s.title}</CardTitle>
                      <span
                        className={
                          "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider " +
                          STATUS_TONE[s.status]
                        }
                      >
                        {tStatus(s.status)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {tCat(s.category)} · {dateFmt(s.createdAt)}
                      {isAdmin && submitter ? ` · ${submitter}` : ""}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <p className="line-clamp-3 text-sm text-muted-foreground">{s.body}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
