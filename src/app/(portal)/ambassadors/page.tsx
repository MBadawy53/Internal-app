import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { Role, type Prisma } from "@prisma/client";
import { requireActor } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { localized } from "@/lib/i18n/localized";
import type { AppLocale } from "@/lib/i18n/config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AmbassadorsPage() {
  const actor = await requireActor();
  // Ambassadors don't have access; bounce them.
  if (actor.role === Role.AMBASSADOR) {
    return null;
  }
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("ambassadors");

  // Admins see every ambassador; BL owners and team managers see ambassadors
  // invited by anyone in their BL; everyone else sees only their own invitees.
  let where: Prisma.UserWhereInput = { role: Role.AMBASSADOR };
  if (actor.role === Role.ADMIN) {
    // no extra filter
  } else if (actor.role === Role.BUSINESS_LINE_OWNER && actor.businessLineId) {
    where = {
      role: Role.AMBASSADOR,
      invitedBy: { businessLineId: actor.businessLineId },
    };
  } else {
    where = { role: Role.AMBASSADOR, invitedById: actor.id };
  }

  const ambassadors = await prisma.user.findMany({
    where,
    select: {
      id: true,
      groupId: true,
      nameEn: true,
      nameAr: true,
      email: true,
      phone: true,
      isActive: true,
      createdAt: true,
      invitedBy: { select: { id: true, nameEn: true, nameAr: true } },
      _count: { select: { ownedLeads: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <div className="brand-underline mt-2 w-16" />
        <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      {ambassadors.length === 0 ? (
        <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          {t("empty")}
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {ambassadors.map((a) => (
            <Card key={a.id} className={a.isActive ? "" : "opacity-60"}>
              <CardHeader>
                <CardTitle className="text-base">
                  {localized(locale, a.nameEn ?? "", a.nameAr ?? "")}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {a.groupId}
                  {!a.isActive ? ` · ${t("inactive")}` : ""}
                </p>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-xs text-muted-foreground">{a.email ?? "—"}</p>
                <p className="text-xs text-muted-foreground">{a.phone ?? "—"}</p>
                <p>
                  <span className="text-muted-foreground">{t("leads")}: </span>
                  <strong>{a._count.ownedLeads}</strong>
                </p>
                {actor.role === Role.ADMIN || actor.role === Role.BUSINESS_LINE_OWNER ? (
                  <p className="text-xs text-muted-foreground">
                    {t("invitedBy")}:{" "}
                    {a.invitedBy
                      ? localized(locale, a.invitedBy.nameEn ?? "", a.invitedBy.nameAr ?? "")
                      : "—"}
                  </p>
                ) : null}
                <p>
                  <Link className="text-brand-700 hover:underline" href={`/leads?ownerId=${a.id}`}>
                    {t("viewLeads")}
                  </Link>
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
