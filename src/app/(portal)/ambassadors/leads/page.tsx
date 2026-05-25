import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Role } from "@prisma/client";
import { requireActor } from "@/lib/auth/session";
import { requireFeatureAccess } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { localized } from "@/lib/i18n/localized";
import type { AppLocale } from "@/lib/i18n/config";
import { Card, CardContent } from "@/components/ui/card";

interface SearchParams {
  employeeId?: string;
}

/**
 * All leads brought in by ambassadors that a given employee invited.
 * Defaults to the current actor; admin can override with ?employeeId=<id>.
 */
export default async function AmbassadorLeadsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const actor = await requireActor();
  requireFeatureAccess(actor, "ambassadors");
  if (actor.role === Role.AMBASSADOR) redirect("/dashboard");
  const sp = await searchParams;
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("ambassadors.leads");
  const tAppStatus = await getTranslations("leads.appStatuses");
  const tProductStatus = await getTranslations("leads.productStatuses");

  // Admin can preview any employee's ambassador-pool; everyone else is
  // scoped to themselves.
  const employeeId = actor.role === Role.ADMIN && sp.employeeId ? sp.employeeId : actor.id;

  const ambassadors = await prisma.user.findMany({
    where: { role: Role.AMBASSADOR, invitedById: employeeId },
    select: { id: true, nameEn: true, nameAr: true, groupId: true },
  });
  const ambassadorIds = ambassadors.map((a) => a.id);
  const nameById = new Map(
    ambassadors.map((a) => [a.id, localized(locale, a.nameEn ?? "", a.nameAr ?? "")] as const),
  );

  const leads =
    ambassadorIds.length === 0
      ? []
      : await prisma.lead.findMany({
          where: {
            OR: [
              { ownerEmployeeId: { in: ambassadorIds } },
              { referredByEmployeeId: { in: ambassadorIds } },
            ],
          },
          include: {
            businessLine: true,
            owner: { select: { id: true, nameEn: true, nameAr: true } },
            referredBy: { select: { id: true, nameEn: true, nameAr: true } },
            product: { select: { id: true, nameEn: true, nameAr: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 500,
        });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <div className="brand-underline mt-2 w-16" />
        <p className="mt-2 text-sm text-muted-foreground">
          {t("subtitle", { count: ambassadors.length })}
        </p>
      </header>

      <Card>
        <CardContent className="p-0">
          {leads.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">{t("empty")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-start">{t("columns.customer")}</th>
                    <th className="px-3 py-2 text-start">{t("columns.phone")}</th>
                    <th className="px-3 py-2 text-start">{t("columns.ambassador")}</th>
                    <th className="px-3 py-2 text-start">{t("columns.businessLine")}</th>
                    <th className="px-3 py-2 text-start">{t("columns.status")}</th>
                    <th className="px-3 py-2 text-start">{t("columns.createdAt")}</th>
                    <th className="px-3 py-2 text-start" />
                  </tr>
                </thead>
                <tbody>
                  {leads.map((l) => {
                    const ambId = l.ownerEmployeeId ?? l.referredByEmployeeId ?? "";
                    const ambName = nameById.get(ambId) ?? "—";
                    return (
                      <tr key={l.id} className="border-b last:border-b-0">
                        <td className="px-3 py-2">{l.customerName}</td>
                        <td className="px-3 py-2 font-mono text-xs">{l.customerPhone}</td>
                        <td className="px-3 py-2">{ambName}</td>
                        <td className="px-3 py-2">
                          {l.businessLine
                            ? localized(locale, l.businessLine.nameEn, l.businessLine.nameAr)
                            : "—"}
                        </td>
                        <td className="px-3 py-2 text-xs">
                          {tAppStatus(l.appStatus)} · {tProductStatus(l.productStatus)}
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {new Date(l.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-2">
                          <Link href={`/leads/${l.id}`} className="text-brand-700 hover:underline">
                            {t("open")}
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
