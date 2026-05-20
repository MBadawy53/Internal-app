import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Role } from "@prisma/client";
import { auth } from "@/lib/auth/config";
import { leadFormTemplateRepository } from "@/server/repositories/leadFormTemplate.repository";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminLeadFormPage() {
  const session = await auth();
  if (session?.user?.role !== Role.ADMIN) redirect("/dashboard");

  const t = await getTranslations("admin.leadForm");
  const templates = await leadFormTemplateRepository.list();

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>
          <div className="brand-underline mt-2 w-16" />
        </div>
        <Button asChild>
          <Link href="/admin/lead-form/new">{t("new")}</Link>
        </Button>
      </header>

      {templates.length === 0 ? (
        <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          {t("empty")}
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {templates.map((tpl) => (
            <Card key={tpl.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span>{tpl.name}</span>
                  {tpl.isDefault ? (
                    <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-brand-700">
                      {t("default")}
                    </span>
                  ) : !tpl.isActive ? (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      {t("inactive")}
                    </span>
                  ) : null}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{t("fieldCount", { count: tpl.fieldCount })}</span>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/admin/lead-form/${tpl.id}`}>{t("edit")}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
