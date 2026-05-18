import { notFound, redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { CommissionPersona, Role } from "@prisma/client";
import { requireActor } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { commissionRepository } from "@/server/repositories/commission.repository";
import { localized } from "@/lib/i18n/localized";
import type { AppLocale } from "@/lib/i18n/config";
import { Card, CardContent } from "@/components/ui/card";
import { CommissionEditor } from "@/components/portal/CommissionEditor";

interface Params {
  params: Promise<{ productId: string }>;
}

export default async function EditCommissionPage({
  params,
  searchParams,
}: Params & { searchParams: Promise<{ persona?: string }> }) {
  const actor = await requireActor();
  if (actor.role !== Role.ADMIN) redirect("/dashboard");
  const { productId } = await params;
  const sp = await searchParams;
  const persona =
    sp.persona === CommissionPersona.AMBASSADOR
      ? CommissionPersona.AMBASSADOR
      : CommissionPersona.EMPLOYEE;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      nameEn: true,
      nameAr: true,
      businessLine: { select: { nameEn: true, nameAr: true } },
    },
  });
  if (!product) notFound();

  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("admin.commission");

  const existing = await commissionRepository.findForProduct(productId, persona);
  const initialTiers = (existing?.tiers ?? []).map((t) => ({
    fromEgp: Number(t.fromAmountPiastres) / 100,
    toEgp: t.toAmountPiastres === null ? null : Number(t.toAmountPiastres) / 100,
    valueType: t.ratePercentBps !== null ? ("percent" as const) : ("flat" as const),
    valueAmount:
      t.ratePercentBps !== null
        ? t.ratePercentBps / 100
        : t.flatPiastres !== null
          ? Number(t.flatPiastres) / 100
          : 0,
    label: t.label ?? "",
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("editTitle")}</h1>
        <div className="brand-underline mt-2 w-16" />
        <p className="mt-1 text-sm">
          <strong>{localized(locale, product.nameEn, product.nameAr)}</strong>
          <span className="ms-1 text-muted-foreground">
            · {localized(locale, product.businessLine.nameEn, product.businessLine.nameAr)}
          </span>
        </p>
        <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
          {persona === "AMBASSADOR" ? t("personaAmbassador") : t("personaEmployee")}
        </p>
      </header>
      <Card>
        <CardContent className="pt-6">
          <CommissionEditor
            productId={product.id}
            persona={persona}
            initialIsActive={existing?.isActive ?? true}
            initialNotes={existing?.notes ?? ""}
            initialTiers={initialTiers}
          />
        </CardContent>
      </Card>
    </div>
  );
}
