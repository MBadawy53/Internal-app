"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createTemplateAction,
  updateTemplateAction,
  type TemplateActionState,
} from "@/server/actions/qrTemplates";

export interface TemplateInitial {
  id?: string;
  name?: string;
  kind?: "LEAD_CAPTURE" | "AMBASSADOR_INVITE";
  headerImageUrl?: string | null;
  titleEn?: string | null;
  titleAr?: string | null;
  subtitleEn?: string | null;
  subtitleAr?: string | null;
  bodyMdEn?: string | null;
  bodyMdAr?: string | null;
}

interface Props {
  initial?: TemplateInitial;
}

export function QrTemplateForm({ initial }: Props) {
  const t = useTranslations("qrTemplates.form");
  const tCommon = useTranslations("common");
  const isEdit = !!initial?.id;
  const [kind, setKind] = useState<"LEAD_CAPTURE" | "AMBASSADOR_INVITE">(
    initial?.kind ?? "LEAD_CAPTURE",
  );
  const action = isEdit ? updateTemplateAction.bind(null, initial!.id!) : createTemplateAction;
  const [state, formAction, pending] = useActionState<TemplateActionState | null, FormData>(
    action,
    null,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="t-name">{t("name")}</Label>
          <Input
            id="t-name"
            name="name"
            required
            minLength={2}
            maxLength={120}
            defaultValue={initial?.name ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="t-kind">{t("kind")}</Label>
          <Select
            id="t-kind"
            name="kind"
            value={kind}
            onChange={(e) => setKind(e.target.value as "LEAD_CAPTURE" | "AMBASSADOR_INVITE")}
          >
            <option value="LEAD_CAPTURE">{t("kindLeadCapture")}</option>
            <option value="AMBASSADOR_INVITE">{t("kindAmbassadorInvite")}</option>
          </Select>
          <p className="text-xs text-muted-foreground">{t("kindHint")}</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="t-header">{t("headerImageUrl")}</Label>
        <Input
          id="t-header"
          name="headerImageUrl"
          type="url"
          placeholder="https://…"
          defaultValue={initial?.headerImageUrl ?? ""}
        />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="t-title-en">{t("titleEn")}</Label>
          <Input
            id="t-title-en"
            name="titleEn"
            maxLength={120}
            defaultValue={initial?.titleEn ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="t-title-ar">{t("titleAr")}</Label>
          <Input
            id="t-title-ar"
            name="titleAr"
            maxLength={120}
            dir="rtl"
            defaultValue={initial?.titleAr ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="t-subtitle-en">{t("subtitleEn")}</Label>
          <Input
            id="t-subtitle-en"
            name="subtitleEn"
            maxLength={240}
            defaultValue={initial?.subtitleEn ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="t-subtitle-ar">{t("subtitleAr")}</Label>
          <Input
            id="t-subtitle-ar"
            name="subtitleAr"
            maxLength={240}
            dir="rtl"
            defaultValue={initial?.subtitleAr ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="t-body-en">{t("bodyEn")}</Label>
          <Textarea
            id="t-body-en"
            name="bodyMdEn"
            rows={8}
            maxLength={5000}
            defaultValue={initial?.bodyMdEn ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="t-body-ar">{t("bodyAr")}</Label>
          <Textarea
            id="t-body-ar"
            name="bodyMdAr"
            rows={8}
            maxLength={5000}
            dir="rtl"
            defaultValue={initial?.bodyMdAr ?? ""}
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? tCommon("saving") : isEdit ? tCommon("save") : tCommon("create")}
        </Button>
        {state && state.ok === false ? (
          <p role="alert" className="text-sm text-destructive">
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
