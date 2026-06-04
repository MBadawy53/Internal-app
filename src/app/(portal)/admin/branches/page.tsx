import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Role } from "@prisma/client";
import { requireActor } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BranchCreateForm, BranchRow } from "@/components/portal/BranchAdmin";

export default async function AdminBranchesPage() {
  const actor = await requireActor();
  if (actor.role !== Role.ADMIN) redirect("/dashboard");
  const t = await getTranslations("admin.branches");

  const branches = await prisma.branch.findMany({
    orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }],
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <div className="brand-underline mt-2 w-16" />
        <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{t("newTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <BranchCreateForm />
        </CardContent>
      </Card>

      <div className="space-y-3">
        {branches.length === 0 ? (
          <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
            {t("empty")}
          </p>
        ) : (
          branches.map((b) => (
            <BranchRow
              key={b.id}
              branch={{
                id: b.id,
                slug: b.slug,
                nameEn: b.nameEn,
                nameAr: b.nameAr,
                city: b.city,
                governorate: b.governorate,
                address: b.address,
                phone: b.phone,
                isActive: b.isActive,
                sortOrder: b.sortOrder,
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}
