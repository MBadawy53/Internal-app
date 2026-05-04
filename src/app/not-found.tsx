import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";

export default async function NotFound() {
  const t = await getTranslations("errors");
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="brand-underline w-24" />
      <h1 className="text-3xl font-semibold">{t("notFound")}</h1>
      <p className="max-w-md text-muted-foreground">{t("notFoundDescription")}</p>
      <Button asChild>
        <Link href="/dashboard">{t("goHome")}</Link>
      </Button>
    </main>
  );
}
