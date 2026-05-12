import Link from "next/link";
import { Bell } from "lucide-react";
import type { Role } from "@prisma/client";
import { BackButton } from "./BackButton";
import { LocaleToggle } from "./LocaleToggle";
import { UserMenu } from "./UserMenu";

interface TopBarProps {
  name: string;
  role: Role;
  referralCode: string;
  unreadNotificationsCount?: number;
}

export function TopBar({ name, role, referralCode, unreadNotificationsCount = 0 }: TopBarProps) {
  const hasUnread = unreadNotificationsCount > 0;
  const badge = unreadNotificationsCount > 99 ? "99+" : String(unreadNotificationsCount);
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/80 px-6 backdrop-blur">
      <div className="flex items-center gap-3">
        <BackButton />
        <code className="hidden rounded-full border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground sm:inline">
          {referralCode}
        </code>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href="/notifications"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {hasUnread ? (
            <span className="absolute -right-1 -top-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-brand-700 px-1 text-[10px] font-semibold leading-4 text-white">
              {badge}
            </span>
          ) : null}
        </Link>
        <LocaleToggle />
        <UserMenu name={name} role={role} />
      </div>
    </header>
  );
}
