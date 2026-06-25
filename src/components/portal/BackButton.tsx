"use client";

import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";

// Hide on the home/dashboard page — there's nowhere meaningful to go back to.
const HIDDEN_ON: ReadonlyArray<string> = ["/dashboard", "/"];

export function BackButton() {
  const router = useRouter();
  const pathname = usePathname();
  const tCommon = useTranslations("common");

  if (HIDDEN_ON.includes(pathname)) return null;

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="inline-flex h-9 items-center gap-1.5 rounded-md border bg-background px-3 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
      aria-label={tCommon("back")}
    >
      <ArrowLeft className="h-4 w-4" />
      <span>{tCommon("back")}</span>
    </button>
  );
}
