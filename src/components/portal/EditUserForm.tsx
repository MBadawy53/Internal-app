"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Role } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { updateUserAction, type ProvisionUserState } from "@/server/actions/users";

interface BL {
  id: string;
  name: string;
}

interface Props {
  userId: string;
  groupId: string | null;
  initial: {
    role: Role;
    businessLineId: string | null;
    managerId: string | null;
    canEditProducts: boolean;
    canEditCatalog: boolean;
  };
  businessLines: BL[];
}

export function EditUserForm({ userId, groupId, initial, businessLines }: Props) {
  const t = useTranslations("admin.users.fields");
  const tCommon = useTranslations("common");
  const tRoles = useTranslations("roles");

  const action = updateUserAction.bind(null, userId);
  const [state, formAction, pending] = useActionState<ProvisionUserState | null, FormData>(
    action,
    null,
  );

  return (
    <form action={formAction} className="space-y-4">
      {groupId ? (
        <div className="rounded-md border bg-secondary/50 px-3 py-2 text-xs">
          <span className="text-muted-foreground">{t("groupId")}:</span>{" "}
          <code className="font-mono font-semibold">{groupId}</code>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="role">{t("role")}</Label>
          <Select id="role" name="role" defaultValue={initial.role} required>
            {Object.values(Role)
              .filter((r) => r !== Role.AMBASSADOR || initial.role === Role.AMBASSADOR)
              .map((r) => (
                <option key={r} value={r}>
                  {tRoles(r)}
                </option>
              ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="businessLineId">{t("businessLine")}</Label>
          <Select
            id="businessLineId"
            name="businessLineId"
            defaultValue={initial.businessLineId ?? ""}
          >
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
            <Checkbox
              name="canEditProducts"
              defaultChecked={initial.canEditProducts}
              className="mt-0.5"
            />
            <span>
              <span className="font-medium">{t("canEditProducts")}</span>
              <span className="block text-xs text-muted-foreground">
                {t("canEditProductsHelp")}
              </span>
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm">
            <Checkbox
              name="canEditCatalog"
              defaultChecked={initial.canEditCatalog}
              className="mt-0.5"
            />
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
          {pending ? tCommon("saving") : tCommon("save")}
        </Button>
        <Button type="button" variant="outline" asChild>
          <a href="/admin/users">{tCommon("cancel")}</a>
        </Button>
      </div>
    </form>
  );
}
