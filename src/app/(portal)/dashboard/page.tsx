import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth/config";

export default async function DashboardPage() {
  const session = await auth();
  const t = await getTranslations("dashboard");
  const tRoles = await getTranslations("roles");
  const name = session?.user?.name ?? session?.user?.email ?? "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title", { name })}</h1>
        <div className="brand-underline mt-2 w-16" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-5 shadow-soft">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {t("yourReferralCode")}
          </p>
          <p className="mt-2 font-mono text-xl font-semibold">{session?.user.referralCode}</p>
        </div>
        <div className="rounded-lg border bg-card p-5 shadow-soft">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("role")}</p>
          <p className="mt-2 text-xl font-semibold">{tRoles(session!.user.role)}</p>
        </div>
      </div>

      <p className="max-w-2xl text-sm text-muted-foreground">{t("phaseOne")}</p>
    </div>
  );
}
