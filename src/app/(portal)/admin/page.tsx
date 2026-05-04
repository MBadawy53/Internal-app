import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Role } from "@prisma/client";
import { auth } from "@/lib/auth/config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminPage() {
  const session = await auth();
  if (session?.user?.role !== Role.ADMIN && session?.user?.role !== Role.BUSINESS_LINE_OWNER) {
    redirect("/dashboard");
  }

  const t = await getTranslations();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("admin.title")}</h1>
        <div className="brand-underline mt-2 w-16" />
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/admin/categories" className="block">
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle>{t("admin.categories.title")}</CardTitle>
              <CardDescription>{t("admin.categories.subtitle")}</CardDescription>
            </CardHeader>
            <CardContent />
          </Card>
        </Link>
        <Link href="/admin/products" className="block">
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle>{t("admin.products.title")}</CardTitle>
              <CardDescription>{t("admin.products.subtitle")}</CardDescription>
            </CardHeader>
            <CardContent />
          </Card>
        </Link>
      </div>
    </div>
  );
}
