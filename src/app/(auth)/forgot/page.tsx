import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth/config";
import { Logo } from "@/components/shared/Logo";
import { LocaleToggle } from "@/components/portal/LocaleToggle";
import { ForgotPasswordForm } from "@/components/portal/ForgotPasswordForm";

export const metadata = { title: "Reset password" };

export default async function ForgotPasswordPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  const t = await getTranslations("auth.forgot");

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between bg-brand-600 p-10 text-white lg:flex">
        <div className="flex items-center gap-3">
          <span className="text-3xl font-extrabold italic">Contact</span>
          <span className="brand-underline w-16" />
        </div>
        <div className="space-y-3">
          <h2 className="text-3xl font-semibold leading-tight">{t("title")}</h2>
          <p className="max-w-sm text-brand-100">{t("subtitle")}</p>
        </div>
        <p className="text-xs text-brand-200">
          © {new Date().getFullYear()} Contact Financial Holding
        </p>
      </aside>

      <section className="flex flex-col justify-between p-6 sm:p-10">
        <div className="flex items-center justify-between">
          <div className="lg:hidden">
            <Logo />
          </div>
          <div className="ms-auto">
            <LocaleToggle />
          </div>
        </div>

        <div className="mx-auto w-full max-w-sm space-y-8">
          <header className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
            <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
          </header>
          <ForgotPasswordForm />
        </div>

        <div />
      </section>
    </main>
  );
}
