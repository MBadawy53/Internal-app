import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth/config";
import { Logo } from "@/components/shared/Logo";
import { LoginForm } from "@/components/portal/LoginForm";
import { LocaleToggle } from "@/components/portal/LocaleToggle";

export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  const t = await getTranslations("auth.login");
  const { from } = await searchParams;

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="relative hidden flex-col justify-between bg-brand-600 p-10 text-white lg:flex">
        <div className="flex items-center gap-3">
          <span className="text-3xl font-extrabold italic">Contact</span>
          <span className="brand-underline w-16" />
        </div>
        <div className="space-y-3">
          <h2 className="text-3xl font-semibold leading-tight">Internal Employee Portal</h2>
          <p className="max-w-sm text-brand-100">
            Browse the catalog, calculate installments, share QR codes, and manage leads across all
            Contact Financial business lines.
          </p>
        </div>
        <p className="text-xs text-brand-200">
          © {new Date().getFullYear()} Contact Financial Holding
        </p>
      </aside>

      {/* Form panel */}
      <section className="flex flex-col justify-between p-6 sm:p-10">
        <div className="flex items-center justify-between">
          <div className="lg:hidden">
            <Logo />
          </div>
          <div className="ml-auto">
            <LocaleToggle />
          </div>
        </div>

        <div className="mx-auto w-full max-w-sm space-y-8">
          <header className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
            <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
          </header>
          <LoginForm from={from} />
        </div>

        <div />
      </section>
    </main>
  );
}
