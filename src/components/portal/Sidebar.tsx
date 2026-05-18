"use client";

import { useEffect, useState } from "react";
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
  X,
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
  {
    href: "/configuration",
    labelKey: "configuration",
    icon: Plug,
    roles: [Role.ADMIN],
  },
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
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close the drawer when the route changes.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const items = NAV.filter(
    (n) => (!n.roles || n.roles.includes(role)) && (!n.feature || visible.has(n.feature)),
  );

  const renderLink = (n: NavItem) => {
    const active = pathname === n.href || pathname.startsWith(`${n.href}/`);
    const Icon = n.icon;
    return (
      <Link
        key={n.href}
        href={n.href}
        onClick={() => setMobileOpen(false)}
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
  };

  return (
    <>
      {/* Floating hamburger — mobile only. */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
        aria-expanded={mobileOpen}
        aria-controls="mobile-sidebar"
        className="fixed start-3 top-3 z-40 inline-flex h-10 w-10 items-center justify-center rounded-md border bg-background text-foreground shadow-soft md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Desktop sidebar. */}
      <aside className="hidden w-60 shrink-0 border-e bg-background md:flex md:flex-col">
        <div className="flex h-16 items-center border-b px-5">
          <Logo />
        </div>
        <nav className="flex-1 space-y-1 p-3">{items.map(renderLink)}</nav>
      </aside>

      {/* Mobile drawer + scrim. */}
      {mobileOpen ? (
        <>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
          />
          <aside
            id="mobile-sidebar"
            className="fixed inset-y-0 start-0 z-50 flex w-64 flex-col border-e bg-background shadow-xl md:hidden"
          >
            <div className="flex h-16 items-center justify-between border-b px-4">
              <Logo />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto p-3">{items.map(renderLink)}</nav>
          </aside>
        </>
      ) : null}
    </>
  );
}
