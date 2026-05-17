import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { AmbassadorApplicationStatus, Role, type Prisma } from "@prisma/client";
import { requireActor } from "@/lib/auth/session";
import { requireFeatureAccess } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { localized } from "@/lib/i18n/localized";
import type { AppLocale } from "@/lib/i18n/config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PendingApplicationCard } from "@/components/portal/PendingApplicationCard";

type Tab = "active" | "pending";

export default async function AmbassadorsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const actor = await requireActor();
  requireFeatureAccess(actor, "ambassadors");
  if (actor.role === Role.AMBASSADOR) {
    return null;
  }
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("ambassadors");
  const sp = await searchParams;
  const tab: Tab = sp.tab === "pending" ? "pending" : "active";

  // Active ambassadors visibility — same rules as before.
  let where: Prisma.UserWhereInput = { role: Role.AMBASSADOR };
  if (actor.role === Role.ADMIN) {
    // no extra filter
  } else if (actor.role === Role.BUSINESS_LINE_OWNER && actor.businessLineId) {
    where = { role: Role.AMBASSADOR, invitedBy: { businessLineId: actor.businessLineId } };
  } else {
    where = { role: Role.AMBASSADOR, invitedById: actor.id };
  }

  const ambassadors =
    tab === "active"
      ? await prisma.user.findMany({
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
            _count: { select: { ownedLeads: true, referredLeads: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 500,
        })
      : [];

  // Pending applications visibility: admin sees all; everyone else sees only
  // applications submitted to a campaign they own.
  const appWhere: Prisma.AmbassadorApplicationWhereInput = {
    status: AmbassadorApplicationStatus.PENDING,
    ...(actor.role === Role.ADMIN ? {} : { employeeId: actor.id }),
  };
  const applications =
    tab === "pending"
      ? await prisma.ambassadorApplication.findMany({
          where: appWhere,
          orderBy: { createdAt: "desc" },
          take: 200,
        })
      : [];
  const pendingCount = await prisma.ambassadorApplication.count({ where: appWhere });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <div className="brand-underline mt-2 w-16" />
        <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <div role="tablist" className="flex gap-2 border-b">
        <TabLink href="/ambassadors" active={tab === "active"} label={t("tabs.active")} />
        <TabLink
          href="/ambassadors?tab=pending"
          active={tab === "pending"}
          label={`${t("tabs.pending")}${pendingCount > 0 ? ` (${pendingCount})` : ""}`}
        />
      </div>

      {tab === "active" ? (
        ambassadors.length === 0 ? (
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
                    <strong>{a._count.ownedLeads + a._count.referredLeads}</strong>
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
                    <Link
                      className="text-brand-700 hover:underline"
                      href={
                        actor.role === Role.ADMIN && a.invitedBy?.id
                          ? `/ambassadors/leads?employeeId=${a.invitedBy.id}`
                          : "/ambassadors/leads"
                      }
                    >
                      {t("viewLeads")}
                    </Link>
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : applications.length === 0 ? (
        <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          {t("applications.empty")}
        </p>
      ) : (
        <div className="grid gap-3">
          {applications.map((a) => (
            <PendingApplicationCard
              key={a.id}
              id={a.id}
              name={a.name}
              phone={a.phone}
              nationalIdImageUrl={a.nationalIdImageUrl}
              createdAt={a.createdAt}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TabLink({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={
        "border-b-2 px-3 py-2 text-sm font-medium transition-colors " +
        (active
          ? "border-brand-700 text-brand-700"
          : "border-transparent text-muted-foreground hover:text-foreground")
      }
    >
      {label}
    </Link>
  );
}
