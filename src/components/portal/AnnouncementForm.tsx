"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { Role } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createAnnouncementAction,
  updateAnnouncementAction,
  type AnnouncementState,
} from "@/server/actions/announcements";

export interface AnnouncementInitial {
  id?: string;
  titleEn?: string;
  titleAr?: string;
  bodyEn?: string;
  bodyAr?: string;
  imageUrl?: string | null;
  targetRoles?: Role[];
  targetBusinessLineIds?: string[];
  startsAt?: Date | null;
  endsAt?: Date | null;
  isActive?: boolean;
  pushNotificationSent?: boolean;
}

interface Props {
  businessLines: { id: string; name: string }[];
  initial?: AnnouncementInitial;
}

const ROLE_OPTIONS: Role[] = [
  Role.EMPLOYEE,
  Role.TEAM_MANAGER,
  Role.BUSINESS_LINE_OWNER,
  Role.AMBASSADOR,
  Role.ADMIN,
];

function isoDateInput(d: Date | null | undefined): string {
  if (!d) return "";
  // <input type="datetime-local"> wants "YYYY-MM-DDTHH:mm".
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AnnouncementForm({ businessLines, initial }: Props) {
  const t = useTranslations("admin.announcements.form");
  const tRoles = useTranslations("roles");
  const tCommon = useTranslations("common");
  const isEdit = !!initial?.id;

  const action = (
    isEdit ? updateAnnouncementAction.bind(null, initial!.id!) : createAnnouncementAction
  ) as (prev: AnnouncementState | null, fd: FormData) => Promise<AnnouncementState>;
  const [state, formAction, pending] = useActionState<AnnouncementState | null, FormData>(
    action,
    null,
  );

  const [roleSet, setRoleSet] = useState<Set<Role>>(new Set(initial?.targetRoles ?? []));
  const [blSet, setBlSet] = useState<Set<string>>(new Set(initial?.targetBusinessLineIds ?? []));

  return (
    <form action={formAction} className="space-y-5" encType="multipart/form-data">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="an-title-en">{t("titleEn")}</Label>
          <Input
            id="an-title-en"
            name="titleEn"
            required
            minLength={2}
            maxLength={160}
            defaultValue={initial?.titleEn ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="an-title-ar">{t("titleAr")}</Label>
          <Input
            id="an-title-ar"
            name="titleAr"
            dir="rtl"
            required
            minLength={2}
            maxLength={160}
            defaultValue={initial?.titleAr ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="an-body-en">{t("bodyEn")}</Label>
          <Textarea
            id="an-body-en"
            name="bodyEn"
            rows={4}
            required
            minLength={2}
            maxLength={5000}
            defaultValue={initial?.bodyEn ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="an-body-ar">{t("bodyAr")}</Label>
          <Textarea
            id="an-body-ar"
            name="bodyAr"
            rows={4}
            dir="rtl"
            required
            minLength={2}
            maxLength={5000}
            defaultValue={initial?.bodyAr ?? ""}
          />
        </div>
      </div>

      <div className="space-y-2 rounded-md border p-3">
        <Label htmlFor="an-image">{t("image")}</Label>
        {initial?.imageUrl ? (
          <div className="space-y-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={initial.imageUrl}
              alt=""
              className="h-32 w-auto rounded-md border bg-white object-contain"
            />
            <label className="flex items-center gap-2 text-xs">
              <Checkbox name="clearImage" />
              <span>{t("clearImage")}</span>
            </label>
          </div>
        ) : null}
        <Input
          id="an-image"
          name="image"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
        />
        <p className="text-xs text-muted-foreground">{t("imageHint")}</p>
      </div>

      <fieldset className="space-y-2 rounded-md border p-3">
        <legend className="px-1 text-sm font-medium">{t("targetRoles")}</legend>
        <div className="flex flex-wrap gap-2">
          {ROLE_OPTIONS.map((r) => (
            <label
              key={r}
              className="flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs"
            >
              <Checkbox
                name="targetRoles"
                value={r}
                checked={roleSet.has(r)}
                onChange={(e) =>
                  setRoleSet((prev) => {
                    const next = new Set(prev);
                    if (e.target.checked) next.add(r);
                    else next.delete(r);
                    return next;
                  })
                }
              />
              <span>{tRoles(r)}</span>
            </label>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{t("targetRolesHint")}</p>
      </fieldset>

      <fieldset className="space-y-2 rounded-md border p-3">
        <legend className="px-1 text-sm font-medium">{t("targetBusinessLines")}</legend>
        <div className="flex flex-wrap gap-2">
          {businessLines.map((b) => (
            <label
              key={b.id}
              className="flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs"
            >
              <Checkbox
                name="targetBusinessLineIds"
                value={b.id}
                checked={blSet.has(b.id)}
                onChange={(e) =>
                  setBlSet((prev) => {
                    const next = new Set(prev);
                    if (e.target.checked) next.add(b.id);
                    else next.delete(b.id);
                    return next;
                  })
                }
              />
              <span>{b.name}</span>
            </label>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{t("targetBusinessLinesHint")}</p>
      </fieldset>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="an-starts">{t("startsAt")}</Label>
          <Input
            id="an-starts"
            name="startsAt"
            type="datetime-local"
            defaultValue={isoDateInput(initial?.startsAt)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="an-ends">{t("endsAt")}</Label>
          <Input
            id="an-ends"
            name="endsAt"
            type="datetime-local"
            defaultValue={isoDateInput(initial?.endsAt)}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox name="isActive" defaultChecked={initial?.isActive ?? true} />
          <span>{t("isActive")}</span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            name="sendNotification"
            defaultChecked={false}
            disabled={initial?.pushNotificationSent === true}
          />
          <span>
            {t("sendNotification")}
            {initial?.pushNotificationSent ? ` (${t("alreadySent")})` : ""}
          </span>
        </label>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? tCommon("saving") : isEdit ? tCommon("save") : t("create")}
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
