import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { Bell } from "lucide-react";
import { requireActor } from "@/lib/auth/session";
import { requireFeatureAccess } from "@/lib/auth/permissions";
import { notificationRepository } from "@/server/repositories/notification.repository";
import { markNotificationReadAction } from "@/server/actions/notifications";
import type { AppLocale } from "@/lib/i18n/config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarkAllReadButton } from "@/components/portal/MarkAllReadButton";
import { readPayload, type NotificationPayload } from "@/lib/notifications/payload";

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
  payload: NotificationPayload | null,
  t: (key: string, values?: Record<string, string | number>) => string,
): string {
  if (!payload) return "";
  switch (payload.type) {
    case "NEW_LEAD_FROM_QR":
      return t("summaries.newLeadFromQr", { name: payload.customerName });
    case "NEW_LEAD_MANUAL":
      return t("summaries.newLeadManual", { name: payload.customerName });
    case "LEAD_STATUS_CHANGED":
      return t("summaries.statusChanged", {
        name: payload.customerName,
        from: payload.fromStatus,
        to: payload.toStatus,
      });
    case "LEAD_REFERRED":
      return t("summaries.referred", { name: payload.customerName });
    case "LEAD_ASSIGNED":
      return t("summaries.assigned", { name: payload.customerName });
    case "LEAD_ID_UPLOADED":
      return t("summaries.leadIdUploaded", { name: payload.customerName });
    case "SUGGESTION_UPDATED":
      return t("summaries.suggestionUpdated", {
        title: payload.title,
        status: payload.status,
      });
    case "SYSTEM":
      return typeof payload.message === "string" ? payload.message : payload.kind;
  }
}

export default async function NotificationsPage() {
  const actor = await requireActor();
  requireFeatureAccess(actor, "notifications");
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
                const payload = readPayload(n.payloadJson);
                const text = summary(payload, (k, v) => t(k, v as never));
                const leadId =
                  payload && "leadId" in payload && typeof payload.leadId === "string"
                    ? payload.leadId
                    : undefined;
                const suggestionId =
                  payload?.type === "SUGGESTION_UPDATED" ? payload.suggestionId : undefined;
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
                        {suggestionId ? (
                          <Link
                            href={`/suggestions/${suggestionId}`}
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
