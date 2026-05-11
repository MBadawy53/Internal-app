import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { requireActor } from "@/lib/auth/session";
import { leadService } from "@/server/services/lead.service";
import { decryptOptional } from "@/lib/crypto/aes-gcm";
import { localized } from "@/lib/i18n/localized";
import type { AppLocale } from "@/lib/i18n/config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeadStatusForm } from "@/components/portal/LeadStatusForm";
import { LeadActivityForm } from "@/components/portal/LeadActivityForm";

interface Params {
  params: Promise<{ id: string }>;
}

export default async function LeadDetailPage({ params }: Params) {
  const actor = await requireActor();
  const { id } = await params;
  const lead = await leadService.get(actor, id);
  if (!lead) notFound();

  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("leads.detail");
  const tStatus = await getTranslations("leads.statuses");
  const tSource = await getTranslations("leads.sources");
  const tType = await getTranslations("leads.activityTypes");

  const email = decryptOptional(lead.customerEmailEnc);
  const nationalId = decryptOptional(lead.nationalIdEnc);
  const dateFmt = (d: Date) => new Date(d).toLocaleString(locale === "ar" ? "ar-EG" : "en-EG");

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-medium uppercase tracking-wide text-brand-700">
          {localized(locale, lead.businessLine.nameEn, lead.businessLine.nameAr)}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{lead.customerName}</h1>
        <div className="brand-underline mt-2 w-16" />
        <p className="mt-1 text-sm text-muted-foreground">
          {tSource(lead.source)} · {tStatus(lead.currentStatus)}
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("info")}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <Stat label={t("phone")} value={lead.customerPhone} mono />
              <Stat label={t("email")} value={email ?? "—"} />
              <Stat label={t("nationalId")} value={nationalId ?? "—"} mono />
              <Stat
                label={t("owner")}
                value={lead.owner ? localized(locale, lead.owner.nameEn, lead.owner.nameAr) : "—"}
              />
              <Stat
                label={t("referredBy")}
                value={
                  lead.referredBy
                    ? localized(locale, lead.referredBy.nameEn, lead.referredBy.nameAr)
                    : "—"
                }
              />
              <Stat
                label={t("product")}
                value={
                  lead.product ? localized(locale, lead.product.nameEn, lead.product.nameAr) : "—"
                }
              />
              <Stat label={t("preferredTime")} value={lead.preferredContactTime ?? "—"} />
              <Stat label={t("createdAt")} value={dateFmt(lead.createdAt)} />
              {lead.customerNote ? (
                <div className="sm:col-span-2">
                  <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                    {t("note")}
                  </dt>
                  <dd className="mt-1 whitespace-pre-wrap rounded-md border bg-secondary/30 p-2 text-sm">
                    {lead.customerNote}
                  </dd>
                </div>
              ) : null}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("status")}</CardTitle>
          </CardHeader>
          <CardContent>
            <LeadStatusForm leadId={lead.id} currentStatus={lead.currentStatus} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("addActivity")}</CardTitle>
        </CardHeader>
        <CardContent>
          <LeadActivityForm leadId={lead.id} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("timeline")}</CardTitle>
        </CardHeader>
        <CardContent>
          {lead.activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noActivities")}</p>
          ) : (
            <ul className="space-y-3">
              {lead.activities.map((a) => (
                <li key={a.id} className="rounded-md border p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="rounded-full bg-secondary px-2 py-0.5 uppercase tracking-wider">
                      {tType(a.type)}
                    </span>
                    <span className="text-muted-foreground">
                      {dateFmt(a.createdAt)} ·{" "}
                      {a.actor ? localized(locale, a.actor.nameEn, a.actor.nameAr) : ""}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm">{a.content}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("history")}</CardTitle>
        </CardHeader>
        <CardContent>
          {lead.history.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noHistory")}</p>
          ) : (
            <ul className="space-y-2">
              {lead.history.map((h) => (
                <li key={h.id} className="rounded-md border p-3 text-sm">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {h.fromStatus ? `${tStatus(h.fromStatus)} → ` : ""}
                      <strong className="text-foreground">{tStatus(h.toStatus)}</strong>
                    </span>
                    <span>
                      {dateFmt(h.createdAt)} ·{" "}
                      {h.actor ? localized(locale, h.actor.nameEn, h.actor.nameAr) : ""}
                    </span>
                  </div>
                  {h.reason ? <p className="mt-1 text-sm">{h.reason}</p> : null}
                  {h.note ? <p className="mt-1 text-xs text-muted-foreground">{h.note}</p> : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        <Link href="/leads" className="hover:underline">
          ← {t("backToList")}
        </Link>
      </p>
    </div>
  );
}

function Stat({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className={`mt-0.5 ${mono ? "font-mono text-xs" : "font-medium"}`}>{value}</dd>
    </div>
  );
}
