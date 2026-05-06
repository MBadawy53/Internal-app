import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Role } from "@prisma/client";
import { auth } from "@/lib/auth/config";
import { attributeRepository } from "@/server/repositories/attribute.repository";
import { localized } from "@/lib/i18n/localized";
import type { AppLocale } from "@/lib/i18n/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminAttributesPage() {
  const session = await auth();
  if (session?.user?.role !== Role.ADMIN) redirect("/dashboard");

  const t = await getTranslations("admin.attributes");
  const tTypes = await getTranslations("admin.attributes.types");
  const locale = (await getLocale()) as AppLocale;

  const attributes = await attributeRepository.list();

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button asChild>
          <Link href="/admin/attributes/new">{t("new")}</Link>
        </Button>
      </header>

      {attributes.length === 0 ? (
        <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          {t("empty")}
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {attributes.map((a) => (
            <Card key={a.id}>
              <CardHeader className="flex-row items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-muted-foreground">{a.key}</p>
                  <CardTitle className="mt-1 text-sm">
                    {localized(locale, a.nameEn, a.nameAr)}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">{tTypes(a.type)}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                      a.isActive
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {a.isActive ? "active" : "inactive"}
                  </span>
                  <Link
                    href={`/admin/attributes/${a.id}/edit`}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    edit
                  </Link>
                </div>
              </CardHeader>
              <CardContent />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
