"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setLocaleAction } from "@/server/actions/locale";

export function LocaleToggle() {
  const t = useTranslations("common");
  const current = useLocale();
  const [pending, startTransition] = useTransition();

  const choose = (locale: "en" | "ar") => {
    startTransition(async () => {
      await setLocaleAction(locale);
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled={pending} aria-label={t("language")}>
          <Languages className="h-4 w-4" aria-hidden />
          <span className="ms-2 text-sm uppercase">{current}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t("language")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => choose("en")}>{t("english")}</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => choose("ar")}>{t("arabic")}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
