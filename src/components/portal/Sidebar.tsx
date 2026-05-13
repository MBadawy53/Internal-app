"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  BarChart3,
  Bell,
  Calculator,
  LayoutDashboard,
  Package,
  QrCode,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import { Role } from "@prisma/client";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/Logo";

type FeatureKey =
  | "dashboard"
  | "catalog"
  | "calculator"
  | "leads"
  | "qr"
  | "ambassadors"
  | "notifications"
  | "reports";

interface NavItem {
  href: string;
  feature?: FeatureKey; // if set, visibility is controlled by the runtime override matrix
  labelKey: FeatureKey | "admin";
  icon: typeof LayoutDashboard;
  roles?: Role[]; // omitted = visible to all authenticated roles
}

const NAV: NavItem[] = [
  { href: "/dashboard", labelKey: "dashboard", icon: LayoutDashboard, feature: "dashboard" },
  { href: "/catalog", labelKey: "catalog", icon: Package, feature: "catalog" },
  { href: "/calculator", labelKey: "calculator", icon: Calculator, feature: "calculator" },
  { href: "/leads", labelKey: "leads", icon: Users, feature: "leads" },
  { href: "/qr", labelKey: "qr", icon: QrCode, feature: "qr" },
  { href: "/ambassadors", labelKey: "ambassadors", icon: Sparkles, feature: "ambassadors" },
  { href: "/notifications", labelKey: "notifications", icon: Bell, feature: "notifications" },
  { href: "/reports", labelKey: "reports", icon: BarChart3, feature: "reports" },
  { href: "/admin", labelKey: "admin", icon: Settings, roles: [Role.ADMIN] },
];

export function Sidebar({
  role,
  visibleFeatures,
}: {
  role: Role;
  visibleFeatures: readonly string[];
}) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const visible = new Set(visibleFeatures);

  return (
    <aside className="hidden w-60 shrink-0 border-e bg-background md:flex md:flex-col">
      <div className="flex h-16 items-center border-b px-5">
        <Logo />
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {NAV.filter(
          (n) => (!n.roles || n.roles.includes(role)) && (!n.feature || visible.has(n.feature)),
        ).map((n) => {
          const active = pathname === n.href || pathname.startsWith(`${n.href}/`);
          const Icon = n.icon;
          return (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-brand-50 font-medium text-brand-700"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              <span>{t(n.labelKey)}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
