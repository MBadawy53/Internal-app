import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { LeadSource, LeadStatus } from "@prisma/client";
import { requireActor } from "@/lib/auth/session";
import { leadService } from "@/server/services/lead.service";
import { localized } from "@/lib/i18n/localized";
import type { AppLocale } from "@/lib/i18n/config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LeadsFilters } from "@/components/portal/LeadsFilters";

interface SearchParams {
  status?: string;
  source?: string;
  q?: string;
  from?: string;
  to?: string;
}

const LEAD_STATUSES = new Set<string>(Object.values(LeadStatus));
const LEAD_SOURCES = new Set<string>(Object.values(LeadSource));

export default async function LeadsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const actor = await requireActor();
  const sp = await searchParams;
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("leads");
  const tStatus = await getTranslations("leads.statuses");
  const tSource = await getTranslations("leads.sources");

  const status = sp.status && LEAD_STATUSES.has(sp.status) ? (sp.status as LeadStatus) : undefined;
  const source = sp.source && LEAD_SOURCES.has(sp.source) ? (sp.source as LeadSource) : undefined;

  const leads = await leadService.list(actor, {
    status,
    source,
    query: sp.q || undefined,
    fromDate: sp.from ? new Date(sp.from) : undefined,
    toDate: sp.to ? new Date(sp.to) : undefined,
  });

  const exportQs = new URLSearchParams();
  if (status) exportQs.set("status", status);
  if (source) exportQs.set("source", source);
  if (sp.q) exportQs.set("q", sp.q);
  if (sp.from) exportQs.set("from", sp.from);
  if (sp.to) exportQs.set("to", sp.to);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <div className="brand-underline mt-2 w-16" />
          <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <a href={`/leads/export?${exportQs.toString()}`}>{t("export")}</a>
          </Button>
          <Button asChild>
            <Link href="/leads/new">{t("new")}</Link>
          </Button>
        </div>
      </header>

      <LeadsFilters
        initial={{
          status: sp.status ?? "",
          source: sp.source ?? "",
          q: sp.q ?? "",
          from: sp.from ?? "",
          to: sp.to ?? "",
        }}
        statuses={Object.values(LeadStatus).map((s) => ({ value: s, label: tStatus(s) }))}
        sources={Object.values(LeadSource).map((s) => ({ value: s, label: tSource(s) }))}
      />

      {leads.length === 0 ? (
        <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          {t("empty")}
        </p>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("count", { n: leads.length })}</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="border-b bg-secondary/40">
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-3 py-2">{t("table.customer")}</th>
                  <th className="px-3 py-2">{t("table.phone")}</th>
                  <th className="px-3 py-2">{t("table.businessLine")}</th>
                  <th className="px-3 py-2">{t("table.status")}</th>
                  <th className="px-3 py-2">{t("table.source")}</th>
                  <th className="px-3 py-2">{t("table.owner")}</th>
                  <th className="px-3 py-2">{t("table.created")}</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l.id} className="border-b last:border-0 hover:bg-secondary/30">
                    <td className="px-3 py-2">
                      <Link
                        href={`/leads/${l.id}`}
                        className="font-medium text-brand-700 hover:underline"
                      >
                        {l.customerName}
                      </Link>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{l.customerPhone}</td>
                    <td className="px-3 py-2">
                      {localized(locale, l.businessLine.nameEn, l.businessLine.nameAr)}
                    </td>
                    <td className="px-3 py-2">
                      <span className="inline-flex rounded-full bg-secondary px-2 py-0.5 text-[10px] uppercase tracking-wider">
                        {tStatus(l.currentStatus)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs">{tSource(l.source)}</td>
                    <td className="px-3 py-2 text-xs">
                      {l.owner ? localized(locale, l.owner.nameEn, l.owner.nameAr) : "—"}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {new Date(l.createdAt).toLocaleDateString(
                        locale === "ar" ? "ar-EG" : "en-EG",
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
