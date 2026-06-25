import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { CommissionPersona, Role } from "@prisma/client";
import { requireActor } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { localized } from "@/lib/i18n/localized";
import type { AppLocale } from "@/lib/i18n/config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminCommissionPage() {
  const actor = await requireActor();
  if (actor.role !== Role.ADMIN) redirect("/dashboard");
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("admin.commission");

  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: {
      id: true,
      nameEn: true,
      nameAr: true,
      businessLine: { select: { nameEn: true, nameAr: true } },
      commissions: {
        select: {
          persona: true,
          isActive: true,
          _count: { select: { tiers: true } },
        },
      },
    },
    orderBy: { nameEn: "asc" },
    take: 500,
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <div className="brand-underline mt-2 w-16" />
        <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      {products.length === 0 ? (
        <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          {t("emptyProducts")}
        </p>
      ) : (
        <div className="grid gap-3">
          {products.map((p) => {
            const emp = p.commissions.find((c) => c.persona === CommissionPersona.EMPLOYEE);
            const amb = p.commissions.find((c) => c.persona === CommissionPersona.AMBASSADOR);
            return (
              <Card key={p.id}>
                <CardHeader>
                  <CardTitle className="text-base">
                    {localized(locale, p.nameEn, p.nameAr)}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {localized(locale, p.businessLine.nameEn, p.businessLine.nameAr)}
                  </p>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-4 text-sm">
                  <PersonaBox
                    label={t("personaEmployee")}
                    tiers={emp?._count.tiers ?? 0}
                    active={emp?.isActive ?? true}
                    href={`/admin/commission/${p.id}?persona=EMPLOYEE`}
                    edit={t("edit")}
                  />
                  <PersonaBox
                    label={t("personaAmbassador")}
                    tiers={amb?._count.tiers ?? 0}
                    active={amb?.isActive ?? true}
                    href={`/admin/commission/${p.id}?persona=AMBASSADOR`}
                    edit={t("edit")}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PersonaBox({
  label,
  tiers,
  active,
  href,
  edit,
}: {
  label: string;
  tiers: number;
  active: boolean;
  href: string;
  edit: string;
}) {
  return (
    <div className="flex-1 rounded-md border bg-secondary/30 p-3">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm">
        <strong>{tiers}</strong> tiers · {active ? "Active" : "Inactive"}
      </p>
      <Link href={href} className="text-xs text-brand-700 hover:underline">
        {edit} →
      </Link>
    </div>
  );
}
