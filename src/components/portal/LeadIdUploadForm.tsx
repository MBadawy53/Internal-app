"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitLeadIdUploadAction, type SubmitIdState } from "@/server/actions/leadIdUpload";

export function LeadIdUploadForm({ token }: { token: string }) {
  const t = useTranslations("public.leadIdUpload");
  const [state, formAction, pending] = useActionState<SubmitIdState, FormData>(
    submitLeadIdUploadAction,
    null,
  );

  if (state?.ok) {
    return (
      <div
        role="status"
        className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
      >
        <p className="font-medium">{t("doneTitle")}</p>
        <p className="mt-1 text-emerald-700">{t("doneBody")}</p>
      </div>
    );
  }

  const errs = state && state.ok === false ? (state.fieldErrors ?? {}) : {};
  const msg = state && state.ok === false ? state.message : null;

  return (
    <form action={formAction} className="space-y-4" encType="multipart/form-data">
      <input type="hidden" name="token" value={token} />
      <div className="space-y-1.5">
        <Label htmlFor="li-front">{t("front")}</Label>
        <Input
          id="li-front"
          name="front"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          required
        />
        {errs.front ? <p className="text-xs text-destructive">{errs.front}</p> : null}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="li-back">{t("back")}</Label>
        <Input
          id="li-back"
          name="back"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          required
        />
        {errs.back ? <p className="text-xs text-destructive">{errs.back}</p> : null}
      </div>
      <p className="text-xs text-muted-foreground">{t("attachmentHint")}</p>

      {msg ? (
        <p role="alert" className="text-sm text-destructive">
          {msg}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
