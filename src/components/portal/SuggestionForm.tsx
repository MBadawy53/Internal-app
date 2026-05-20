"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { SuggestionCategory } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createSuggestionAndRedirectAction,
  updateSuggestionAction,
  type CreateSuggestionState,
  type UpdateSuggestionState,
} from "@/server/actions/suggestions";

interface Initial {
  title?: string;
  body?: string;
  category?: SuggestionCategory;
}

interface Props {
  mode: "create" | "edit";
  suggestionId?: string;
  initial?: Initial;
}

export function SuggestionForm({ mode, suggestionId, initial }: Props) {
  const t = useTranslations("suggestions.form");
  const tCat = useTranslations("suggestions.categories");
  const tCommon = useTranslations("common");

  type State = CreateSuggestionState | UpdateSuggestionState;
  const action = (
    mode === "edit" && suggestionId
      ? updateSuggestionAction.bind(null, suggestionId)
      : createSuggestionAndRedirectAction
  ) as (prev: State, fd: FormData) => Promise<State>;
  const [state, formAction, pending] = useActionState<State, FormData>(action, null);

  const errs = state && state.ok === false ? (state.fieldErrors ?? {}) : {};
  const msg = state && state.ok === false ? state.message : null;

  return (
    <form action={formAction} className="space-y-4" encType="multipart/form-data">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="s-title">{t("title")}</Label>
          <Input
            id="s-title"
            name="title"
            required
            minLength={3}
            maxLength={160}
            defaultValue={initial?.title ?? ""}
            aria-invalid={Boolean(errs.title)}
          />
          {errs.title ? <p className="text-xs text-destructive">{errs.title}</p> : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="s-category">{t("category")}</Label>
          <Select
            id="s-category"
            name="category"
            defaultValue={initial?.category ?? SuggestionCategory.IDEA}
          >
            {Object.values(SuggestionCategory).map((c) => (
              <option key={c} value={c}>
                {tCat(c)}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="s-body">{t("body")}</Label>
        <Textarea
          id="s-body"
          name="body"
          rows={6}
          required
          minLength={10}
          maxLength={4000}
          defaultValue={initial?.body ?? ""}
          aria-invalid={Boolean(errs.body)}
        />
        <p className="text-xs text-muted-foreground">{t("bodyHint")}</p>
        {errs.body ? <p className="text-xs text-destructive">{errs.body}</p> : null}
      </div>

      {mode === "create" ? (
        <div className="space-y-1.5">
          <Label htmlFor="s-attachment">{t("attachment")}</Label>
          <Input
            id="s-attachment"
            name="attachment"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
          />
          <p className="text-xs text-muted-foreground">{t("attachmentHint")}</p>
          {errs.attachment ? <p className="text-xs text-destructive">{errs.attachment}</p> : null}
        </div>
      ) : null}

      {msg ? (
        <p role="alert" className="text-sm text-destructive">
          {msg}
        </p>
      ) : null}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? tCommon("saving") : mode === "edit" ? tCommon("save") : t("submit")}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/suggestions">{tCommon("cancel")}</Link>
        </Button>
      </div>
    </form>
  );
}
