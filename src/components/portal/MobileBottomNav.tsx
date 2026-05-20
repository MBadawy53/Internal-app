"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  BarChart3,
  Bell,
  Calculator,
  LayoutDashboard,
  Menu,
  Package,
  Percent,
  Plug,
  QrCode,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import { Role } from "@prisma/client";
import { cn } from "@/lib/utils";

type FeatureKey =
  | "dashboard"
  | "catalog"
  | "calculator"
  | "leads"
  | "qr"
  | "ambassadors"
  | "commission"
  | "notifications"
  | "reports"
  | "configuration";

interface NavItem {
  href: string;
  feature?: FeatureKey;
  labelKey: FeatureKey | "admin";
  icon: typeof LayoutDashboard;
  roles?: Role[];
}

// Mirror of Sidebar's NAV. Keeping a separate copy here (rather than
// extracting into a shared module) so the bottom nav can pick a
// custom ordering / subset without affecting the sidebar.
const NAV: NavItem[] = [
  { href: "/dashboard", labelKey: "dashboard", icon: LayoutDashboard, feature: "dashboard" },
  { href: "/catalog", labelKey: "catalog", icon: Package, feature: "catalog" },
  { href: "/calculator", labelKey: "calculator", icon: Calculator, feature: "calculator" },
  { href: "/leads", labelKey: "leads", icon: Users, feature: "leads" },
  { href: "/qr", labelKey: "qr", icon: QrCode, feature: "qr" },
  { href: "/ambassadors", labelKey: "ambassadors", icon: Sparkles, feature: "ambassadors" },
  { href: "/commission", labelKey: "commission", icon: Percent, feature: "commission" },
  { href: "/notifications", labelKey: "notifications", icon: Bell, feature: "notifications" },
  { href: "/reports", labelKey: "reports", icon: BarChart3, feature: "reports" },
  { href: "/configuration", labelKey: "configuration", icon: Plug, roles: [Role.ADMIN] },
  { href: "/admin", labelKey: "admin", icon: Settings, roles: [Role.ADMIN] },
];

/**
 * Sticky bottom navigation for mobile. Renders the first four items
 * the user has access to, plus a "Menu" tab that opens the full
 * sidebar drawer (which lives in Sidebar.tsx — communicated via a
 * `mobile-nav:open` window event so the two components stay
 * decoupled).
 */
export function MobileBottomNav({
  role,
  visibleFeatures,
}: {
  role: Role;
  visibleFeatures: readonly string[];
}) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const visible = new Set(visibleFeatures);

  const items = NAV.filter(
    (n) => (!n.roles || n.roles.includes(role)) && (!n.feature || visible.has(n.feature)),
  ).slice(0, 4);

  const renderLink = (n: NavItem) => {
    const active = pathname === n.href || pathname.startsWith(`${n.href}/`);
    const Icon = n.icon;
    return (
      <Link
        key={n.href}
        href={n.href}
        className={cn(
          "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] transition-colors",
          active ? "text-brand-700" : "text-muted-foreground hover:text-foreground",
        )}
        aria-current={active ? "page" : undefined}
      >
        <Icon className="h-5 w-5" aria-hidden />
        <span className="leading-none">{t(n.labelKey)}</span>
      </Link>
    );
  };

  return (
    <nav
      aria-label="Mobile primary"
      className="fixed inset-x-0 bottom-0 z-30 flex border-t bg-background/95 backdrop-blur md:hidden"
    >
      {items.map(renderLink)}
      <button
        type="button"
        onClick={() => window.dispatchEvent(new CustomEvent("mobile-nav:open"))}
        className="flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
        aria-label={t("more")}
      >
        <Menu className="h-5 w-5" aria-hidden />
        <span className="leading-none">{t("more")}</span>
      </button>
    </nav>
  );
}
