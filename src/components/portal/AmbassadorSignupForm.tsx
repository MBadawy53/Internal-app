"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ambassadorSignupAction, type AmbassadorSignupState } from "@/server/actions/qr";

interface Props {
  code: string;
}

export function AmbassadorSignupForm({ code }: Props) {
  const t = useTranslations("public.ambassadorSignup");
  const [state, formAction, pending] = useActionState<AmbassadorSignupState | null, FormData>(
    ambassadorSignupAction,
    null,
  );

  if (state && state.ok) {
    return (
      <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-4 text-center text-sm text-emerald-700">
        {t("thanks")}
      </p>
    );
  }

  const errs = state && state.ok === false ? (state.fieldErrors ?? {}) : {};

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="code" value={code} />
      <label aria-hidden className="absolute -left-[9999px] top-auto h-0 w-0 overflow-hidden">
        <span>Leave this field empty.</span>
        <input type="text" name="company" tabIndex={-1} autoComplete="off" defaultValue="" />
      </label>

      <p className="rounded-md border bg-secondary/30 p-3 text-sm">{t("intro")}</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="as-name-en">{t("nameEn")}</Label>
          <Input
            id="as-name-en"
            name="nameEn"
            required
            minLength={2}
            maxLength={120}
            aria-invalid={Boolean(errs.nameEn)}
          />
          {errs.nameEn ? <p className="text-xs text-destructive">{errs.nameEn}</p> : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="as-name-ar">{t("nameAr")}</Label>
          <Input
            id="as-name-ar"
            name="nameAr"
            required
            minLength={2}
            maxLength={120}
            dir="rtl"
            aria-invalid={Boolean(errs.nameAr)}
          />
          {errs.nameAr ? <p className="text-xs text-destructive">{errs.nameAr}</p> : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="as-email">{t("email")}</Label>
          <Input
            id="as-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-invalid={Boolean(errs.email)}
          />
          {errs.email ? <p className="text-xs text-destructive">{errs.email}</p> : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="as-phone">{t("phone")}</Label>
          <Input
            id="as-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            required
            aria-invalid={Boolean(errs.phone)}
          />
          {errs.phone ? <p className="text-xs text-destructive">{errs.phone}</p> : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="as-password">{t("password")}</Label>
          <Input
            id="as-password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            aria-invalid={Boolean(errs.password)}
          />
          {errs.password ? <p className="text-xs text-destructive">{errs.password}</p> : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="as-password-confirm">{t("passwordConfirm")}</Label>
          <Input
            id="as-password-confirm"
            name="passwordConfirm"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            aria-invalid={Boolean(errs.passwordConfirm)}
          />
          {errs.passwordConfirm ? (
            <p className="text-xs text-destructive">{errs.passwordConfirm}</p>
          ) : null}
        </div>
      </div>

      <label className="flex items-start gap-2 rounded-md border bg-secondary/30 p-3 text-sm">
        <Checkbox name="consentGiven" required />
        <span>{t("consent")}</span>
      </label>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? t("submitting") : t("submit")}
      </Button>

      {state && state.ok === false && state.message ? (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
