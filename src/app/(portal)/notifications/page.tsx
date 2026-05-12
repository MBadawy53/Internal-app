import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { Bell } from "lucide-react";
import { requireActor } from "@/lib/auth/session";
import { notificationRepository } from "@/server/repositories/notification.repository";
import { markNotificationReadAction } from "@/server/actions/notifications";
import type { AppLocale } from "@/lib/i18n/config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarkAllReadButton } from "@/components/portal/MarkAllReadButton";

function relTime(d: Date, locale: AppLocale): string {
  const intl = new Intl.RelativeTimeFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    numeric: "auto",
  });
  const diffMs = d.getTime() - Date.now();
  const abs = Math.abs(diffMs);
  const min = 60_000;
  const hr = 60 * min;
  const day = 24 * hr;
  if (abs < hr) return intl.format(Math.round(diffMs / min), "minute");
  if (abs < day) return intl.format(Math.round(diffMs / hr), "hour");
  return intl.format(Math.round(diffMs / day), "day");
}

function summary(
  type: string,
  payload: Record<string, unknown>,
  t: (key: string, values?: Record<string, string | number>) => string,
): string {
  const name = String(payload.customerName ?? "");
  switch (type) {
    case "NEW_LEAD_FROM_QR":
      return t("summaries.newLeadFromQr", { name });
    case "NEW_LEAD_MANUAL":
      return t("summaries.newLeadManual", { name });
    case "LEAD_STATUS_CHANGED":
      return t("summaries.statusChanged", {
        name,
        from: String(payload.fromStatus ?? ""),
        to: String(payload.toStatus ?? ""),
      });
    case "LEAD_REFERRED":
      return t("summaries.referred", { name });
    case "LEAD_ASSIGNED":
      return t("summaries.assigned", { name });
    case "SYSTEM":
      return String(payload.message ?? "");
    default:
      return type;
  }
}

export default async function NotificationsPage() {
  const actor = await requireActor();
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("notifications");
  const items = await notificationRepository.listForUser(actor.id, 100);
  const unread = items.filter((n) => !n.readAt).length;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <div className="brand-underline mt-2 w-16" />
          <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <MarkAllReadButton disabled={unread === 0} />
      </header>

      {items.length === 0 ? (
        <p className="rounded-md border border-dashed p-10 text-center text-sm text-muted-foreground">
          <Bell className="mx-auto mb-2 h-6 w-6 opacity-50" />
          {t("empty")}
        </p>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("count", { total: items.length, unread })}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y">
              {items.map((n) => {
                const payload = (n.payloadJson as Record<string, unknown>) ?? {};
                const text = summary(n.type, payload, (k, v) => t(k, v as never));
                const leadId = typeof payload.leadId === "string" ? payload.leadId : undefined;
                const isUnread = !n.readAt;
                return (
                  <li
                    key={n.id}
                    className={
                      "flex items-start gap-3 px-3 py-3 text-sm " +
                      (isUnread ? "bg-secondary/30" : "")
                    }
                  >
                    {isUnread ? (
                      <span
                        aria-hidden
                        className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-brand-700"
                      />
                    ) : (
                      <span aria-hidden className="mt-1 inline-block h-2 w-2 shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className={isUnread ? "font-medium" : "text-muted-foreground"}>{text}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t(`types.${n.type}`)} · {relTime(new Date(n.createdAt), locale)}
                      </p>
                      <div className="mt-2 flex gap-3 text-xs">
                        {leadId ? (
                          <Link
                            href={`/leads/${leadId}`}
                            className="text-brand-700 hover:underline"
                          >
                            {t("view")}
                          </Link>
                        ) : null}
                        {isUnread ? (
                          <form action={markNotificationReadAction}>
                            <input type="hidden" name="id" value={n.id} />
                            <button type="submit" className="text-muted-foreground hover:underline">
                              {t("markRead")}
                            </button>
                          </form>
                        ) : null}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
