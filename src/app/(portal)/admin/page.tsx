import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Role } from "@prisma/client";
import { auth } from "@/lib/auth/config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === Role.ADMIN;
  const isBLOwner = session?.user?.role === Role.BUSINESS_LINE_OWNER;
  const canProducts = session?.user?.canEditProducts === true;
  const canCatalog = session?.user?.canEditCatalog === true;
  if (!session?.user || (!isAdmin && !isBLOwner && !canProducts && !canCatalog)) {
    redirect("/dashboard");
  }

  const t = await getTranslations();
  const showProducts = isAdmin || isBLOwner || canProducts;
  const showCategories = isAdmin || isBLOwner || canCatalog;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("admin.title")}</h1>
        <div className="brand-underline mt-2 w-16" />
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {showCategories ? (
          <Link href="/admin/categories" className="block">
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle>{t("admin.categories.title")}</CardTitle>
                <CardDescription>{t("admin.categories.subtitle")}</CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          </Link>
        ) : null}
        {showProducts ? (
          <Link href="/admin/products" className="block">
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle>{t("admin.products.title")}</CardTitle>
                <CardDescription>{t("admin.products.subtitle")}</CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          </Link>
        ) : null}
        {isAdmin ? (
          <Link href="/admin/attributes" className="block">
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle>{t("admin.attributes.title")}</CardTitle>
                <CardDescription>{t("admin.attributes.subtitle")}</CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          </Link>
        ) : null}
        {isAdmin ? (
          <Link href="/admin/users" className="block">
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle>{t("admin.users.title")}</CardTitle>
                <CardDescription>{t("admin.users.subtitle")}</CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          </Link>
        ) : null}
        {isAdmin ? (
          <Link href="/admin/qr-templates" className="block">
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle>{t("qrTemplates.title")}</CardTitle>
                <CardDescription>{t("qrTemplates.subtitle")}</CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          </Link>
        ) : null}
        {isAdmin ? (
          <Link href="/admin/permissions" className="block">
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle>{t("admin.permissions.title")}</CardTitle>
                <CardDescription>{t("admin.permissions.subtitle")}</CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          </Link>
        ) : null}
        {isAdmin ? (
          <Link href="/admin/announcements" className="block">
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle>{t("admin.announcements.title")}</CardTitle>
                <CardDescription>{t("admin.announcements.subtitle")}</CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          </Link>
        ) : null}
        {isAdmin ? (
          <Link href="/admin/commission" className="block">
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle>{t("admin.commission.title")}</CardTitle>
                <CardDescription>{t("admin.commission.subtitle")}</CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          </Link>
        ) : null}
        {isAdmin ? (
          <Link href="/admin/lead-form" className="block">
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle>{t("admin.leadForm.title")}</CardTitle>
                <CardDescription>{t("admin.leadForm.subtitle")}</CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          </Link>
        ) : null}
      </div>
    </div>
  );
}
