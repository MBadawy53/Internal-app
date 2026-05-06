import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Role } from "@prisma/client";
import { auth } from "@/lib/auth/config";
import { AttributeForm } from "@/components/portal/AttributeForm";

export default async function NewAttributePage() {
  const session = await auth();
  if (session?.user?.role !== Role.ADMIN) redirect("/dashboard");

  const t = await getTranslations("admin.attributes");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("new")}</h1>
        <div className="brand-underline mt-2 w-16" />
      </header>
      <AttributeForm />
    </div>
  );
}
