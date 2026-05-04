import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Role } from "@prisma/client";
import { auth } from "@/lib/auth/config";
import { PhasePlaceholder } from "../_placeholder";

export default async function AdminPage() {
  const session = await auth();
  if (session?.user?.role !== Role.ADMIN) redirect("/dashboard");

  const t = await getTranslations("nav");
  return <PhasePlaceholder title={t("admin")} phase={7} />;
}
