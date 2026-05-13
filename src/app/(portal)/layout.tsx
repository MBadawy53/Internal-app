import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/portal/Sidebar";
import { TopBar } from "@/components/portal/TopBar";
import { notificationRepository } from "@/server/repositories/notification.repository";
import { ensureEffectiveMatrix, visibleFeaturesFor } from "@/lib/auth/rbac";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Best-effort unread count for the bell badge; never blocks rendering.
  const unread = await notificationRepository.unreadCount(session.user.id).catch(() => 0);

  // Read the referral code straight from the DB so a freshly-migrated
  // user (referralCode now mirrors groupId) sees the new value without
  // needing to sign out — the JWT may still hold the old one.
  const live = await prisma.user
    .findUnique({ where: { id: session.user.id }, select: { referralCode: true } })
    .catch(() => null);
  const referralCode = live?.referralCode ?? session.user.referralCode;

  // Sidebar visibility comes from runtime overrides (admin-editable). Cached.
  await ensureEffectiveMatrix();
  const visibleFeatures = visibleFeaturesFor(session.user.role);

  return (
    <div className="flex min-h-screen bg-muted/30">
      <Sidebar role={session.user.role} visibleFeatures={visibleFeatures} />
      <div className="flex flex-1 flex-col">
        <TopBar
          name={session.user.name ?? session.user.email ?? ""}
          role={session.user.role}
          referralCode={referralCode}
          unreadNotificationsCount={unread}
        />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
