import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Role } from "@prisma/client";
import { requireActor } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { FEATURE_KEYS, ROLE_MATRIX } from "@/lib/auth/rbac";
import { Card, CardContent } from "@/components/ui/card";
import { PermissionsEditor } from "@/components/portal/PermissionsEditor";
import { EDITABLE_PERMS } from "@/server/actions/permissions";

const EDITABLE_ROLES: Role[] = [
  Role.EMPLOYEE,
  Role.TEAM_MANAGER,
  Role.BUSINESS_LINE_OWNER,
  Role.AMBASSADOR,
];

export default async function PermissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const actor = await requireActor();
  if (actor.role !== Role.ADMIN) redirect("/dashboard");
  const t = await getTranslations("admin.permissions");
  const tRoles = await getTranslations("roles");
  const tNav = await getTranslations("nav");

  const sp = await searchParams;
  const requested = (sp.role ?? "").toUpperCase();
  const role: Role = EDITABLE_ROLES.includes(requested as Role)
    ? (requested as Role)
    : Role.EMPLOYEE;

  // Load this role's current overrides; fall back to the hardcoded defaults
  // for any (feature / permission) the admin hasn't customised yet.
  const [vis, perms] = await Promise.all([
    prisma.roleFeatureAccess.findMany({ where: { role } }),
    prisma.rolePermission.findMany({ where: { role } }),
  ]);
  const visMap = new Map(vis.map((v) => [v.feature, v.visible]));
  const permMap = new Map(perms.map((p) => [`${p.action}:${p.resource}`, p.enabled]));

  const defaults = ROLE_MATRIX[role];
  const features = FEATURE_KEYS.map((f) => ({
    key: f,
    label: tNav(f),
    visible: visMap.get(f) ?? true, // default visible
  }));

  // Group permissions by resource for a slightly more navigable layout.
  const permsByResource = new Map<
    string,
    { action: string; resource: string; enabled: boolean }[]
  >();
  for (const p of EDITABLE_PERMS) {
    const key = `${p.action}:${p.resource}`;
    const enabled = permMap.get(key) ?? Object.prototype.hasOwnProperty.call(defaults, key);
    const arr = permsByResource.get(p.resource) ?? [];
    arr.push({ action: p.action, resource: p.resource, enabled });
    permsByResource.set(p.resource, arr);
  }
  const permGroups = Array.from(permsByResource.entries()).map(([resource, items]) => ({
    resource,
    items,
  }));

  const roleOptions = EDITABLE_ROLES.map((r) => ({ value: r, label: tRoles(r) }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <div className="brand-underline mt-2 w-16" />
        <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>
      <Card>
        <CardContent className="pt-6">
          <PermissionsEditor
            role={role}
            roleOptions={roleOptions}
            features={features}
            permGroups={permGroups}
          />
        </CardContent>
      </Card>
    </div>
  );
}
