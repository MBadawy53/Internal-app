import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Role } from "@prisma/client";
import { requireActor } from "@/lib/auth/session";
import { announcementRepository } from "@/server/repositories/announcement.repository";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  deleteAnnouncementSafeAction,
  toggleAnnouncementAction,
} from "@/server/actions/announcements";
import { DeleteButton } from "@/components/portal/DeleteButton";
import type { AppLocale } from "@/lib/i18n/config";
import { localized } from "@/lib/i18n/localized";

export default async function AnnouncementsPage() {
  const actor = await requireActor();
  if (actor.role !== Role.ADMIN) redirect("/dashboard");
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("admin.announcements");
  const tRoles = await getTranslations("roles");

  const rows = await announcementRepository.list();

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <div className="brand-underline mt-2 w-16" />
          <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Link href="/admin/announcements/new">
          <Button>+ {t("new")}</Button>
        </Link>
      </header>

      {rows.length === 0 ? (
        <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          {t("empty")}
        </p>
      ) : (
        <div className="grid gap-3">
          {rows.map((a) => (
            <Card key={a.id} className={a.isActive ? "" : "opacity-60"}>
              <CardContent className="flex items-start gap-4 py-4">
                {a.imageUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={a.imageUrl}
                    alt=""
                    className="h-16 w-24 shrink-0 rounded-md border bg-white object-cover"
                  />
                ) : null}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{localized(locale, a.titleEn, a.titleAr)}</p>
                    {!a.isActive ? (
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] uppercase tracking-wider">
                        {t("inactive")}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {a.targetRoles.length > 0
                      ? a.targetRoles.map((r) => tRoles(r)).join(" · ")
                      : t("allRoles")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {a.startsAt ? new Date(a.startsAt).toLocaleString() : "—"}
                    {" → "}
                    {a.endsAt ? new Date(a.endsAt).toLocaleString() : "—"}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 text-xs">
                  <Link
                    href={`/admin/announcements/${a.id}/edit`}
                    className="text-brand-700 hover:underline"
                  >
                    {t("edit")}
                  </Link>
                  <form action={toggleAnnouncementAction}>
                    <input type="hidden" name="id" value={a.id} />
                    <input type="hidden" name="isActive" value={a.isActive ? "false" : "true"} />
                    <button type="submit" className="text-brand-700 hover:underline">
                      {a.isActive ? t("deactivate") : t("activate")}
                    </button>
                  </form>
                  <DeleteButton
                    action={deleteAnnouncementSafeAction.bind(null, a.id)}
                    variant="ghost"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
