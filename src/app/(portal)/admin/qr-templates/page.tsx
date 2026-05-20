import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Role } from "@prisma/client";
import { requireActor } from "@/lib/auth/session";
import { qrLandingTemplateRepository } from "@/server/repositories/qrLandingTemplate.repository";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/portal/DeleteButton";
import { deleteTemplateAction } from "@/server/actions/qrTemplates";

export default async function QrTemplatesPage() {
  const actor = await requireActor();
  if (actor.role !== Role.ADMIN) redirect("/dashboard");

  const t = await getTranslations("qrTemplates");
  const templates = await qrLandingTemplateRepository.listAll();

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <div className="brand-underline mt-2 w-16" />
          <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button asChild>
          <Link href="/admin/qr-templates/new">{t("new")}</Link>
        </Button>
      </header>

      {templates.length === 0 ? (
        <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          {t("empty")}
        </p>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("listTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="border-b bg-secondary/40">
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-3 py-2">{t("table.name")}</th>
                  <th className="px-3 py-2">{t("table.status")}</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {templates.map((tpl) => (
                  <tr key={tpl.id} className="border-b last:border-0 hover:bg-secondary/30">
                    <td className="px-3 py-2 font-medium">{tpl.name}</td>
                    <td className="px-3 py-2 text-xs">
                      {tpl.isActive ? t("active") : t("inactive")}
                    </td>
                    <td className="px-3 py-2 text-right text-xs">
                      <div className="inline-flex items-center gap-3">
                        <Link
                          className="text-brand-700 hover:underline"
                          href={`/admin/qr-templates/${tpl.id}/edit`}
                        >
                          {t("edit")}
                        </Link>
                        <DeleteButton
                          action={deleteTemplateAction.bind(null, tpl.id)}
                          variant="ghost"
                          iconOnly
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
