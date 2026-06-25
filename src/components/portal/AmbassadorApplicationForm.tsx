"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  submitAmbassadorApplicationAction,
  type SubmitApplicationState,
} from "@/server/actions/ambassadorApplications";

interface Props {
  code: string;
}

export function AmbassadorApplicationForm({ code }: Props) {
  const t = useTranslations("public.ambassadorApplication");
  const [state, formAction, pending] = useActionState<SubmitApplicationState | null, FormData>(
    submitAmbassadorApplicationAction,
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
    <form action={formAction} className="space-y-4" encType="multipart/form-data">
      <input type="hidden" name="code" value={code} />
      <label aria-hidden className="absolute -left-[9999px] top-auto h-0 w-0 overflow-hidden">
        <span>Leave this field empty.</span>
        <input type="text" name="company" tabIndex={-1} autoComplete="off" defaultValue="" />
      </label>

      <p className="rounded-md border bg-secondary/30 p-3 text-sm">{t("intro")}</p>

      <div className="space-y-1.5">
        <Label htmlFor="aa-name">{t("name")}</Label>
        <Input
          id="aa-name"
          name="name"
          required
          minLength={2}
          maxLength={160}
          aria-invalid={Boolean(errs.name)}
        />
        {errs.name ? <p className="text-xs text-destructive">{errs.name}</p> : null}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="aa-phone">{t("phone")}</Label>
        <Input
          id="aa-phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          required
          aria-invalid={Boolean(errs.phone)}
        />
        {errs.phone ? <p className="text-xs text-destructive">{errs.phone}</p> : null}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="aa-id-image">{t("nationalIdImage")}</Label>
        <Input
          id="aa-id-image"
          name="nationalIdImage"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          aria-invalid={Boolean(errs.nationalIdImage)}
        />
        <p className="text-xs text-muted-foreground">{t("nationalIdImageHint")}</p>
        {errs.nationalIdImage ? (
          <p className="text-xs text-destructive">{errs.nationalIdImage}</p>
        ) : null}
      </div>

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
