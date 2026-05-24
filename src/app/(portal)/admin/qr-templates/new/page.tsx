import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Role } from "@prisma/client";
import { requireActor } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { QrTemplateForm } from "@/components/portal/QrTemplateForm";
import { readFields } from "@/lib/leadForm/types";

export default async function NewQrTemplatePage() {
  const actor = await requireActor();
  if (actor.role !== Role.ADMIN) redirect("/dashboard");
  const t = await getTranslations("qrTemplates");

  const otherTemplates = await prisma.qrLandingTemplate.findMany({
    where: { isActive: true },
    select: { id: true, name: true, customFields: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const copySources = otherTemplates
    .map((o) => ({ id: o.id, name: o.name, fields: readFields(o.customFields) }))
    .filter((s) => s.fields.length > 0);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("new")}</h1>
        <div className="brand-underline mt-2 w-16" />
      </header>
      <Card>
        <CardContent className="pt-6">
          <QrTemplateForm copySources={copySources} />
        </CardContent>
      </Card>
    </div>
  );
}
