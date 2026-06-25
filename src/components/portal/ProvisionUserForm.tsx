"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Role } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { provisionUserAction, type ProvisionUserState } from "@/server/actions/users";

interface BL {
  id: string;
  name: string;
}

export function ProvisionUserForm({ businessLines }: { businessLines: BL[] }) {
  const t = useTranslations("admin.users.fields");
  const tCommon = useTranslations("common");
  const tRoles = useTranslations("roles");

  const [state, formAction, pending] = useActionState<ProvisionUserState | null, FormData>(
    provisionUserAction,
    null,
  );

  const errs = state && !state.ok ? (state.fieldErrors ?? {}) : {};

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="groupId">{t("groupId")}</Label>
          <Input
            id="groupId"
            name="groupId"
            required
            placeholder="C0001C"
            pattern="C[0-9]{4}C"
            autoCapitalize="characters"
            spellCheck={false}
          />
          {errs.groupId ? (
            <p className="text-xs text-destructive">{errs.groupId.join(", ")}</p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="role">{t("role")}</Label>
          <Select id="role" name="role" defaultValue={Role.EMPLOYEE} required>
            {Object.values(Role)
              .filter((r) => r !== Role.AMBASSADOR)
              .map((r) => (
                <option key={r} value={r}>
                  {tRoles(r)}
                </option>
              ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="businessLineId">{t("businessLine")}</Label>
          <Select id="businessLineId" name="businessLineId">
            <option value="">—</option>
            {businessLines.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <fieldset className="rounded-md border p-4">
        <legend className="px-1 text-sm font-medium">{t("capabilities")}</legend>
        <p className="mb-3 text-xs text-muted-foreground">{t("capabilitiesHelp")}</p>
        <div className="space-y-2">
          <label className="flex items-start gap-2 text-sm">
            <Checkbox name="canEditProducts" className="mt-0.5" />
            <span>
              <span className="font-medium">{t("canEditProducts")}</span>
              <span className="block text-xs text-muted-foreground">
                {t("canEditProductsHelp")}
              </span>
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm">
            <Checkbox name="canEditCatalog" className="mt-0.5" />
            <span>
              <span className="font-medium">{t("canEditCatalog")}</span>
              <span className="block text-xs text-muted-foreground">{t("canEditCatalogHelp")}</span>
            </span>
          </label>
        </div>
      </fieldset>

      {state?.ok === false && state.message ? (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      ) : null}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? tCommon("saving") : tCommon("create")}
        </Button>
        <Button type="button" variant="outline" asChild>
          <a href="/admin/users">{tCommon("cancel")}</a>
        </Button>
      </div>
    </form>
  );
}
