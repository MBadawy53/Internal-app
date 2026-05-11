import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Role } from "@prisma/client";
import { requireActor } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { catalogService } from "@/server/services/catalog.service";
import { localized } from "@/lib/i18n/localized";
import type { AppLocale } from "@/lib/i18n/config";
import { LeadForm } from "@/components/portal/LeadForm";

export default async function NewLeadPage() {
  const actor = await requireActor();

  // RBAC: anyone with create:lead can land here. The service action also
  // re-checks; this is the routing-level gate.
  // (requirePermission throws in the action if not allowed.)

  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("leads");

  const [businessLines, products] = await Promise.all([
    catalogService.listBusinessLines(actor),
    catalogService.listProducts(actor),
  ]);

  // Owners list: only shown to admins / BL owners / managers. Employees
  // become the owner automatically.
  const showOwnerPicker = actor.role !== Role.EMPLOYEE;
  let owners: { id: string; name: string; businessLineId?: string }[] = [];
  if (showOwnerPicker) {
    const where =
      actor.role === Role.ADMIN
        ? { isActive: true, role: Role.EMPLOYEE }
        : actor.role === Role.BUSINESS_LINE_OWNER && actor.businessLineId
          ? {
              isActive: true,
              role: Role.EMPLOYEE,
              businessLineId: actor.businessLineId,
            }
          : { isActive: true, role: Role.EMPLOYEE, managerId: actor.id };
    const employees = await prisma.user.findMany({
      where,
      select: { id: true, nameEn: true, nameAr: true, businessLineId: true },
      orderBy: { nameEn: "asc" },
      take: 500,
    });
    owners = employees.map((e) => ({
      id: e.id,
      name: localized(locale, e.nameEn ?? "", e.nameAr ?? ""),
      businessLineId: e.businessLineId ?? undefined,
    }));
    if (owners.length === 0) {
      // Allow at least the actor (BL owner / manager) themselves as the owner.
      owners = [
        {
          id: actor.id,
          name: "(me)",
          businessLineId: actor.businessLineId ?? undefined,
        },
      ];
    }
  } else if (!actor.businessLineId) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("new")}</h1>
        <div className="brand-underline mt-2 w-16" />
      </header>
      <LeadForm
        businessLines={businessLines.map((b) => ({
          id: b.id,
          name: localized(locale, b.nameEn, b.nameAr),
        }))}
        products={products.map((p) => ({
          id: p.id,
          name: localized(locale, p.nameEn, p.nameAr),
          businessLineId: p.businessLineId,
        }))}
        owners={owners}
        showOwnerPicker={showOwnerPicker}
      />
    </div>
  );
}
