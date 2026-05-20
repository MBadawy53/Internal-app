import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Role } from "@prisma/client";
import { auth } from "@/lib/auth/config";
import { LeadFormTemplateEditor } from "@/components/portal/LeadFormTemplateEditor";

export default async function NewLeadFormTemplatePage() {
  const session = await auth();
  if (session?.user?.role !== Role.ADMIN) redirect("/dashboard");

  const t = await getTranslations("admin.leadForm");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("new")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>
        <div className="brand-underline mt-2 w-16" />
      </header>
      <LeadFormTemplateEditor mode="create" />
    </div>
  );
}
