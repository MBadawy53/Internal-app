import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Role } from "@prisma/client";
import { auth } from "@/lib/auth/config";
import { leadFormTemplateRepository } from "@/server/repositories/leadFormTemplate.repository";
import { LeadFormTemplateEditor } from "@/components/portal/LeadFormTemplateEditor";

export default async function EditLeadFormTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (session?.user?.role !== Role.ADMIN) redirect("/dashboard");

  const { id } = await params;
  const tpl = await leadFormTemplateRepository.findById(id);
  if (!tpl) notFound();
  const t = await getTranslations("admin.leadForm");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("edit")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{tpl.name}</p>
        <div className="brand-underline mt-2 w-16" />
      </header>
      <LeadFormTemplateEditor
        mode="edit"
        templateId={tpl.id}
        initial={{
          name: tpl.name,
          isDefault: tpl.isDefault,
          isActive: tpl.isActive,
          fields: tpl.fields,
        }}
      />
    </div>
  );
}
