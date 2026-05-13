"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { saveRolePermissionsAction, type SavePermissionsState } from "@/server/actions/permissions";

interface FeatureRow {
  key: string;
  label: string;
  visible: boolean;
}

interface PermItem {
  action: string;
  resource: string;
  enabled: boolean;
}

interface PermGroup {
  resource: string;
  items: PermItem[];
}

interface Props {
  role: string;
  roleOptions: { value: string; label: string }[];
  features: FeatureRow[];
  permGroups: PermGroup[];
}

export function PermissionsEditor({ role, roleOptions, features, permGroups }: Props) {
  const t = useTranslations("admin.permissions");
  const tCommon = useTranslations("common");
  const tResources = useTranslations("admin.permissions.resources");
  const tActions = useTranslations("admin.permissions.actions");
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [state, formAction, pending] = useActionState<SavePermissionsState | null, FormData>(
    saveRolePermissionsAction,
    null,
  );

  // Local state mirrors the form so the user sees their edits without round-tripping.
  const [featureMap, setFeatureMap] = useState<Record<string, boolean>>(
    Object.fromEntries(features.map((f) => [f.key, f.visible])),
  );
  const [permMap, setPermMap] = useState<Record<string, boolean>>(
    Object.fromEntries(
      permGroups.flatMap((g) => g.items.map((i) => [`${i.action}:${i.resource}`, i.enabled])),
    ),
  );

  function safeResource(key: string): string {
    try {
      return tResources(key);
    } catch {
      return key;
    }
  }
  function safeAction(key: string): string {
    try {
      return tActions(key);
    } catch {
      return key;
    }
  }

  return (
    <form action={formAction} className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="perm-role">{t("selectRole")}</Label>
          <Select
            id="perm-role"
            name="role"
            value={role}
            onChange={(e) => {
              const next = e.target.value;
              startTransition(() => router.replace(`/admin/permissions?role=${next}`));
            }}
          >
            {roleOptions.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </Select>
        </div>
        <p className="text-xs text-muted-foreground">{t("hint")}</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          {t("featuresHeading")}
        </h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {features.map((f) => (
            <label
              key={f.key}
              className="flex items-center gap-2 rounded-md border bg-secondary/30 px-3 py-2 text-sm"
            >
              <Checkbox
                name="features"
                value={f.key}
                checked={featureMap[f.key] ?? false}
                onChange={(e) => setFeatureMap((prev) => ({ ...prev, [f.key]: e.target.checked }))}
              />
              <span>{f.label}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          {t("actionsHeading")}
        </h2>
        <div className="space-y-3">
          {permGroups.map((g) => (
            <div key={g.resource} className="rounded-md border p-3">
              <h3 className="text-sm font-medium">{safeResource(g.resource)}</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {g.items.map((i) => {
                  const k = `${i.action}:${i.resource}`;
                  return (
                    <label
                      key={k}
                      className="flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs"
                    >
                      <Checkbox
                        name="permissions"
                        value={k}
                        checked={permMap[k] ?? false}
                        onChange={(e) => setPermMap((prev) => ({ ...prev, [k]: e.target.checked }))}
                      />
                      <span>{safeAction(i.action)}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? tCommon("saving") : t("save")}
        </Button>
        {state && state.ok === false ? (
          <p role="alert" className="text-sm text-destructive">
            {state.message}
          </p>
        ) : null}
        {state && state.ok ? <p className="text-sm text-emerald-600">{t("saved")}</p> : null}
      </div>
    </form>
  );
}
