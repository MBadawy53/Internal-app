import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth, GROUP_ID_REGEX } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { Logo } from "@/components/shared/Logo";
import { LocaleToggle } from "@/components/portal/LocaleToggle";
import { OnboardForm, OnboardLookup } from "@/components/portal/OnboardForm";

export const metadata = { title: "Activate account" };

export default async function OnboardPage({
  searchParams,
}: {
  searchParams: Promise<{ groupId?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  const sp = await searchParams;
  const t = await getTranslations("auth.onboard");

  const groupId = sp.groupId?.trim().toUpperCase();
  let lookupError: string | null = null;
  let user: {
    groupId: string;
    mustCompleteProfile: boolean;
    passwordHash: string | null;
    isActive: boolean;
  } | null = null;

  if (groupId) {
    if (!GROUP_ID_REGEX.test(groupId)) {
      lookupError = t("errors.groupIdNotFound");
    } else {
      const found = await prisma.user.findUnique({
        where: { groupId },
        select: { groupId: true, mustCompleteProfile: true, passwordHash: true, isActive: true },
      });
      if (!found || !found.isActive || !found.groupId) {
        lookupError = t("errors.groupIdNotFound");
      } else if (found.passwordHash && !found.mustCompleteProfile) {
        lookupError = t("errors.alreadyActivated");
      } else {
        user = { ...found, groupId: found.groupId };
      }
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
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

      {/* Form panel */}
      <section className="flex flex-col justify-between p-6 sm:p-10">
        <div className="flex items-center justify-between">
          <div className="lg:hidden">
            <Logo />
          </div>
          <div className="ms-auto">
            <LocaleToggle />
          </div>
        </div>

        <div className="mx-auto w-full max-w-md space-y-8">
          <header className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {user ? t("title") : t("lookupTitle")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {user ? t("subtitle") : t("lookupSubtitle")}
            </p>
          </header>

          {lookupError ? (
            <p
              role="alert"
              className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {lookupError}
            </p>
          ) : null}

          {user ? <OnboardForm groupId={user.groupId} /> : <OnboardLookup />}
        </div>

        <div />
      </section>
    </main>
  );
}
