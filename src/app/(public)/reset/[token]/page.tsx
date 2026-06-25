import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/shared/Logo";
import { LocaleToggle } from "@/components/portal/LocaleToggle";
import { ResetPasswordForm } from "@/components/portal/ResetPasswordForm";

export const metadata = { title: "Set a new password" };

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const t = await getTranslations("public.passwordReset");

  return (
    <main className="flex min-h-screen flex-col items-center bg-muted/30 p-6">
      <div className="flex w-full max-w-md flex-col gap-6 py-6">
        <div className="flex w-full items-center justify-between">
          <Logo withTagline />
          <LocaleToggle />
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-soft">
          <h1 className="text-xl font-semibold">{t("title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>
          <div className="mt-4">
            <ResetPasswordForm token={token} />
          </div>
        </div>
      </div>
    </main>
  );
}
