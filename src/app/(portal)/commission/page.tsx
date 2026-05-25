import { getLocale, getTranslations } from "next-intl/server";
import { CommissionPersona, LeadProductStatus, Role } from "@prisma/client";
import { requireActor } from "@/lib/auth/session";
import { requireFeatureAccess } from "@/lib/auth/permissions";
import { commissionRepository } from "@/server/repositories/commission.repository";
import { prisma } from "@/lib/prisma";
import { localized } from "@/lib/i18n/localized";
import type { AppLocale } from "@/lib/i18n/config";
import { formatMoney } from "@/lib/finance/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { computeLeadCommission } from "@/server/services/commission.service";

type CommissionRow = Awaited<ReturnType<typeof commissionRepository.listForPersona>>[number];

function personaForRole(role: Role): CommissionPersona {
  return role === Role.AMBASSADOR ? CommissionPersona.AMBASSADOR : CommissionPersona.EMPLOYEE;
}

function CommissionGrid({
  rows,
  locale,
  emptyLabel,
  noTiersLabel,
  bracketLabel,
  valueLabel,
}: {
  rows: CommissionRow[];
  locale: AppLocale;
  emptyLabel: string;
  noTiersLabel: string;
  bracketLabel: string;
  valueLabel: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </p>
    );
  }
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {rows.map((c) => (
        <Card key={c.id}>
          <CardHeader>
            <CardTitle className="text-base">
              {localized(locale, c.product.nameEn, c.product.nameAr)}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {localized(locale, c.product.businessLine.nameEn, c.product.businessLine.nameAr)}
            </p>
          </CardHeader>
          <CardContent>
            {c.tiers.length === 0 ? (
              <p className="text-sm text-muted-foreground">{noTiersLabel}</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="py-1 text-start">{bracketLabel}</th>
                    <th className="py-1 text-start">{valueLabel}</th>
                  </tr>
                </thead>
                <tbody>
                  {c.tiers.map((tier) => {
                    const tierValue =
                      tier.ratePercentBps !== null
                        ? `${(tier.ratePercentBps / 100).toFixed(2)}%`
                        : tier.flatPiastres !== null
                          ? formatMoney(tier.flatPiastres, locale)
                          : "—";
                    const bracket = `${formatMoney(tier.fromAmountPiastres, locale)} — ${
                      tier.toAmountPiastres ? formatMoney(tier.toAmountPiastres, locale) : "∞"
                    }`;
                    return (
                      <tr key={tier.id} className="border-t">
                        <td className="py-1">
                          {tier.label ? (
                            <>
                              <span className="font-medium">{tier.label}</span>
                              <span className="ms-1 text-xs text-muted-foreground">{bracket}</span>
                            </>
                          ) : (
                            bracket
                          )}
                        </td>
                        <td className="py-1 font-medium">{tierValue}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            {c.notes ? (
              <p className="mt-3 whitespace-pre-line text-xs text-muted-foreground">{c.notes}</p>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface EarnedRow {
  leadId: string;
  customerName: string;
  productName: string;
  recipientName: string;
  persona: CommissionPersona;
  amountPiastres: bigint;
  commissionPiastres: bigint;
  tierMatched: boolean;
  closedAt: Date;
}

async function loadEarnedCommissions(
  actor: { id: string; role: Role },
  locale: AppLocale,
): Promise<EarnedRow[]> {
  const isAdmin = actor.role === Role.ADMIN;
  // Visibility: admins see all; everyone else sees rows where they're owner
  // or referredBy.
  const leads = await prisma.lead.findMany({
    where: {
      productStatus: LeadProductStatus.CONTRACT,
      finalLoanAmountPiastres: { not: null },
      ...(isAdmin
        ? {}
        : { OR: [{ ownerEmployeeId: actor.id }, { referredByEmployeeId: actor.id }] }),
    },
    select: {
      id: true,
      customerName: true,
      productId: true,
      finalLoanAmountPiastres: true,
      ownerEmployeeId: true,
      referredByEmployeeId: true,
      updatedAt: true,
      owner: { select: { id: true, nameEn: true, nameAr: true, role: true } },
      referredBy: { select: { id: true, nameEn: true, nameAr: true, role: true } },
      product: { select: { nameEn: true, nameAr: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 500,
  });

  const out: EarnedRow[] = [];
  for (const l of leads) {
    const computed = await computeLeadCommission({
      productId: l.productId,
      finalLoanAmountPiastres: l.finalLoanAmountPiastres,
      ownerEmployeeId: l.ownerEmployeeId,
      referredByEmployeeId: l.referredByEmployeeId,
      owner: l.owner ? { id: l.owner.id, role: l.owner.role } : null,
      referredBy: l.referredBy ? { id: l.referredBy.id, role: l.referredBy.role } : null,
    });
    if (!computed) continue;
    const recipient =
      l.owner && computed.recipient.userId === l.owner.id
        ? l.owner
        : l.referredBy && computed.recipient.userId === l.referredBy.id
          ? l.referredBy
          : null;
    out.push({
      leadId: l.id,
      customerName: l.customerName,
      productName: l.product ? localized(locale, l.product.nameEn, l.product.nameAr) : "—",
      recipientName: recipient ? localized(locale, recipient.nameEn, recipient.nameAr) : "—",
      persona: computed.recipient.persona,
      amountPiastres: computed.amountPiastres,
      commissionPiastres: computed.commissionPiastres,
      tierMatched: computed.tier !== null,
      closedAt: l.updatedAt,
    });
  }
  return out;
}

function EarnedCommissionsTable({
  rows,
  locale,
  emptyLabel,
  columns,
  noMatchingTierLabel,
  personaLabels,
}: {
  rows: EarnedRow[];
  locale: AppLocale;
  emptyLabel: string;
  columns: {
    lead: string;
    product: string;
    recipient: string;
    amount: string;
    commission: string;
    closedAt: string;
    persona: string;
  };
  noMatchingTierLabel: string;
  personaLabels: Record<CommissionPersona, string>;
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </p>
    );
  }
  return (
    <Card>
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-start">{columns.lead}</th>
              <th className="px-3 py-2 text-start">{columns.product}</th>
              <th className="px-3 py-2 text-start">{columns.recipient}</th>
              <th className="px-3 py-2 text-start">{columns.persona}</th>
              <th className="px-3 py-2 text-end">{columns.amount}</th>
              <th className="px-3 py-2 text-end">{columns.commission}</th>
              <th className="px-3 py-2 text-start">{columns.closedAt}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.leadId} className="border-b last:border-0">
                <td className="px-3 py-2">
                  <a href={`/leads/${r.leadId}`} className="text-brand-700 hover:underline">
                    {r.customerName}
                  </a>
                </td>
                <td className="px-3 py-2">{r.productName}</td>
                <td className="px-3 py-2">{r.recipientName}</td>
                <td className="px-3 py-2 text-xs">
                  <span className="rounded-full bg-secondary px-2 py-0.5 uppercase tracking-wider">
                    {personaLabels[r.persona]}
                  </span>
                </td>
                <td className="px-3 py-2 text-end">{formatMoney(r.amountPiastres, locale)}</td>
                <td className="px-3 py-2 text-end font-medium">
                  {r.tierMatched ? (
                    formatMoney(r.commissionPiastres, locale)
                  ) : (
                    <span className="text-xs text-muted-foreground">{noMatchingTierLabel}</span>
                  )}
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {new Date(r.closedAt).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-EG")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

export default async function CommissionPage() {
  const actor = await requireActor();
  requireFeatureAccess(actor, "commission");
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("commission");

  const isAdmin = actor.role === Role.ADMIN;
  const earned = await loadEarnedCommissions(actor, locale);
  const personaLabels: Record<CommissionPersona, string> = {
    EMPLOYEE: t("earnedColumns.persona") /* fallback, overridden by labels below */,
    AMBASSADOR: t("earnedColumns.persona"),
  };
  // Use specific labels from the lead commission card namespace.
  const tCard = await getTranslations("leads.commissionCard.persona");
  personaLabels.EMPLOYEE = tCard("EMPLOYEE");
  personaLabels.AMBASSADOR = tCard("AMBASSADOR");

  const earnedSection = (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold tracking-tight">{t("sectionEarned")}</h2>
      <p className="text-sm text-muted-foreground">{t("earnedSubtitle")}</p>
      <EarnedCommissionsTable
        rows={earned}
        locale={locale}
        emptyLabel={t("earnedEmpty")}
        columns={{
          lead: t("earnedColumns.lead"),
          product: t("earnedColumns.product"),
          recipient: t("earnedColumns.recipient"),
          amount: t("earnedColumns.amount"),
          commission: t("earnedColumns.commission"),
          closedAt: t("earnedColumns.closedAt"),
          persona: t("earnedColumns.persona"),
        }}
        noMatchingTierLabel={t("noMatchingTier")}
        personaLabels={personaLabels}
      />
    </section>
  );

  if (isAdmin) {
    const [employeeRows, ambassadorRows] = await Promise.all([
      commissionRepository.listForPersona(CommissionPersona.EMPLOYEE),
      commissionRepository.listForPersona(CommissionPersona.AMBASSADOR),
    ]);
    return (
      <div className="space-y-8">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <div className="brand-underline mt-2 w-16" />
          <p className="mt-2 text-sm text-muted-foreground">{t("subtitle.ADMIN")}</p>
        </header>

        {earnedSection}

        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">{t("sectionEmployee")}</h2>
          <CommissionGrid
            rows={employeeRows}
            locale={locale}
            emptyLabel={t("empty")}
            noTiersLabel={t("noTiers")}
            bracketLabel={t("columns.bracket")}
            valueLabel={t("columns.value")}
          />
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">{t("sectionAmbassador")}</h2>
          <CommissionGrid
            rows={ambassadorRows}
            locale={locale}
            emptyLabel={t("empty")}
            noTiersLabel={t("noTiers")}
            bracketLabel={t("columns.bracket")}
            valueLabel={t("columns.value")}
          />
        </section>
      </div>
    );
  }

  const persona = personaForRole(actor.role);
  const rows = await commissionRepository.listForPersona(persona);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <div className="brand-underline mt-2 w-16" />
        <p className="mt-2 text-sm text-muted-foreground">{t(`subtitle.${persona}`)}</p>
      </header>

      {earnedSection}

      <CommissionGrid
        rows={rows}
        locale={locale}
        emptyLabel={t("empty")}
        noTiersLabel={t("noTiers")}
        bracketLabel={t("columns.bracket")}
        valueLabel={t("columns.value")}
      />
    </div>
  );
}
