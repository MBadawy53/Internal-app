import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { Sidebar } from "@/components/portal/Sidebar";
import { TopBar } from "@/components/portal/TopBar";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex min-h-screen bg-muted/30">
      <Sidebar role={session.user.role} />
      <div className="flex flex-1 flex-col">
        <TopBar
          name={session.user.name ?? session.user.email ?? ""}
          role={session.user.role}
          referralCode={session.user.referralCode}
        />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
