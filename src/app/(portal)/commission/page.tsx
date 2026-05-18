import { getLocale, getTranslations } from "next-intl/server";
import { CommissionPersona, Role } from "@prisma/client";
import { requireActor } from "@/lib/auth/session";
import { requireFeatureAccess } from "@/lib/auth/permissions";
import { commissionRepository } from "@/server/repositories/commission.repository";
import { localized } from "@/lib/i18n/localized";
import type { AppLocale } from "@/lib/i18n/config";
import { formatMoney } from "@/lib/finance/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function personaForRole(role: Role): CommissionPersona {
  return role === Role.AMBASSADOR ? CommissionPersona.AMBASSADOR : CommissionPersona.EMPLOYEE;
}

export default async function CommissionPage() {
  const actor = await requireActor();
  requireFeatureAccess(actor, "commission");
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("commission");

  const persona = personaForRole(actor.role);
  const rows = await commissionRepository.listForPersona(persona);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <div className="brand-underline mt-2 w-16" />
        <p className="mt-2 text-sm text-muted-foreground">{t(`subtitle.${persona}`)}</p>
      </header>

      {rows.length === 0 ? (
        <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          {t("empty")}
        </p>
      ) : (
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
                  <p className="text-sm text-muted-foreground">{t("noTiers")}</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="py-1 text-start">{t("columns.bracket")}</th>
                        <th className="py-1 text-start">{t("columns.value")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {c.tiers.map((tier) => {
                        const valueLabel =
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
                                  <span className="ms-1 text-xs text-muted-foreground">
                                    {bracket}
                                  </span>
                                </>
                              ) : (
                                bracket
                              )}
                            </td>
                            <td className="py-1 font-medium">{valueLabel}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
                {c.notes ? (
                  <p className="mt-3 whitespace-pre-line text-xs text-muted-foreground">
                    {c.notes}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
