"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  createBranchAction,
  deleteBranchAction,
  updateBranchAction,
  type BranchActionState,
} from "@/server/actions/branches";

interface Branch {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  city: string | null;
  governorate: string | null;
  address: string | null;
  phone: string | null;
  isActive: boolean;
  sortOrder: number;
}

function FieldGrid({ initial, idPrefix }: { initial?: Partial<Branch>; idPrefix: string }) {
  const tFields = useTranslations("admin.branches.fields");
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-slug`}>{tFields("slug")}</Label>
        <Input
          id={`${idPrefix}-slug`}
          name="slug"
          defaultValue={initial?.slug ?? ""}
          placeholder="cairo-mohandessin"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-sortOrder`}>{tFields("sortOrder")}</Label>
        <Input
          id={`${idPrefix}-sortOrder`}
          name="sortOrder"
          type="number"
          min={0}
          defaultValue={initial?.sortOrder ?? 0}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-nameEn`}>{tFields("nameEn")}</Label>
        <Input
          id={`${idPrefix}-nameEn`}
          name="nameEn"
          defaultValue={initial?.nameEn ?? ""}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-nameAr`}>{tFields("nameAr")}</Label>
        <Input
          id={`${idPrefix}-nameAr`}
          name="nameAr"
          defaultValue={initial?.nameAr ?? ""}
          dir="rtl"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-city`}>{tFields("city")}</Label>
        <Input id={`${idPrefix}-city`} name="city" defaultValue={initial?.city ?? ""} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-governorate`}>{tFields("governorate")}</Label>
        <Input
          id={`${idPrefix}-governorate`}
          name="governorate"
          defaultValue={initial?.governorate ?? ""}
        />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor={`${idPrefix}-address`}>{tFields("address")}</Label>
        <Input id={`${idPrefix}-address`} name="address" defaultValue={initial?.address ?? ""} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-phone`}>{tFields("phone")}</Label>
        <Input id={`${idPrefix}-phone`} name="phone" defaultValue={initial?.phone ?? ""} />
      </div>
      <label className="flex items-center gap-2 self-end pb-2 text-sm">
        <Checkbox name="isActive" defaultChecked={initial?.isActive ?? true} />
        <span>{tFields("isActive")}</span>
      </label>
    </div>
  );
}

export function BranchCreateForm() {
  const t = useTranslations("admin.branches");
  const tCommon = useTranslations("common");
  const [state, formAction, pending] = useActionState<BranchActionState, FormData>(
    createBranchAction,
    null,
  );
  return (
    <form action={formAction} className="space-y-4">
      <FieldGrid idPrefix="new" />
      <div className="flex items-center gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? tCommon("saving") : t("create")}
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

export function BranchRow({ branch }: { branch: Branch }) {
  const t = useTranslations("admin.branches");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const updateBound = updateBranchAction.bind(null, branch.id);
  const [state, formAction, pending] = useActionState<BranchActionState, FormData>(
    updateBound,
    null,
  );
  return (
    <div className="rounded-md border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium">
            {branch.nameEn}
            <span className="ms-2 text-xs text-muted-foreground">{branch.nameAr}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            {branch.slug}
            {branch.governorate ? ` · ${branch.governorate}` : ""}
            {branch.isActive ? "" : ` · ${tCommon("inactive")}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => setOpen((v) => !v)}>
            {open ? tCommon("cancel") : tCommon("edit")}
          </Button>
          <form
            action={async () => {
              await deleteBranchAction(branch.id);
            }}
          >
            <Button
              type="submit"
              size="sm"
              variant="ghost"
              className="text-destructive"
              onClick={(e) => {
                if (!confirm(t("deleteConfirm"))) e.preventDefault();
              }}
            >
              {tCommon("delete")}
            </Button>
          </form>
        </div>
      </div>
      {open ? (
        <form action={formAction} className="mt-4 space-y-4">
          <FieldGrid initial={branch} idPrefix={`row-${branch.id}`} />
          <div className="flex items-center gap-2">
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? tCommon("saving") : tCommon("save")}
            </Button>
            {state && state.ok === false ? (
              <p role="alert" className="text-sm text-destructive">
                {state.message}
              </p>
            ) : null}
          </div>
        </form>
      ) : null}
    </div>
  );
}
