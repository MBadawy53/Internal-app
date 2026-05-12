import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Role } from "@prisma/client";
import { auth } from "@/lib/auth/config";
import { userAdminRepository } from "@/server/repositories/userAdmin.repository";
import { localized } from "@/lib/i18n/localized";
import type { AppLocale } from "@/lib/i18n/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UsersSearchBar } from "@/components/portal/UsersSearchBar";

interface SearchParams {
  q?: string;
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  if (session?.user?.role !== Role.ADMIN) redirect("/dashboard");

  const sp = await searchParams;
  const t = await getTranslations("admin.users");
  const tRoles = await getTranslations("roles");
  const locale = (await getLocale()) as AppLocale;

  const users = await userAdminRepository.list({ q: sp.q });

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button asChild>
          <Link href="/admin/users/new">{t("new")}</Link>
        </Button>
      </header>

      <UsersSearchBar initial={sp.q ?? ""} />

      {users.length === 0 ? (
        <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          {t("search.empty")}
        </p>
      ) : null}

      <div className="grid gap-3">
        {users.map((u) => {
          const blName = u.businessLine
            ? localized(locale, u.businessLine.nameEn, u.businessLine.nameAr)
            : "—";
          return (
            <Card key={u.id}>
              <CardHeader className="flex-row items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-sm font-semibold">
                    {u.groupId ?? <span className="italic text-muted-foreground">no group ID</span>}
                  </p>
                  <CardTitle className="mt-1 text-sm">
                    {u.nameEn ?? u.email ?? (
                      <span className="italic text-muted-foreground">unactivated</span>
                    )}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">{u.email ?? "—"}</p>
                </div>
                <div className="flex flex-col items-end gap-1 text-right">
                  <span className="text-xs uppercase tracking-wide text-brand-700">
                    {tRoles(u.role)}
                  </span>
                  <span className="text-xs text-muted-foreground">{blName}</span>
                  <div className="mt-1 flex flex-wrap justify-end gap-1">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                        u.isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {u.isActive ? "active" : "inactive"}
                    </span>
                    {u.mustCompleteProfile ? (
                      <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-accent-700">
                        pending
                      </span>
                    ) : null}
                    {u.canEditProducts ? (
                      <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-brand-700">
                        products
                      </span>
                    ) : null}
                    {u.canEditCatalog ? (
                      <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-brand-700">
                        catalog
                      </span>
                    ) : null}
                  </div>
                  <a
                    href={`/admin/users/${u.id}/edit`}
                    className="mt-1 text-xs font-medium text-primary hover:underline"
                  >
                    edit
                  </a>
                </div>
              </CardHeader>
              <CardContent />
            </Card>
          );
        })}
      </div>
    </div>
  );
}
