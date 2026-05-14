import { getLocale, getTranslations } from "next-intl/server";
import { type Role } from "@prisma/client";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/prisma";
import { announcementRepository } from "@/server/repositories/announcement.repository";
import { localized } from "@/lib/i18n/localized";
import type { AppLocale } from "@/lib/i18n/config";

export default async function DashboardPage() {
  const session = await auth();
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("dashboard");
  const tRoles = await getTranslations("roles");
  const name = session?.user?.name ?? session?.user?.email ?? "";

  // Read referralCode live from DB so a freshly-migrated user (referralCode
  // mirrors groupId) sees the new value without signing out — the JWT may
  // still hold the old one.
  const live = session?.user?.id
    ? await prisma.user
        .findUnique({ where: { id: session.user.id }, select: { referralCode: true } })
        .catch(() => null)
    : null;
  const referralCode = live?.referralCode ?? session?.user?.referralCode ?? "";

  // Active announcements targeted at this user. We surface the actual error
  // for admins so a missing table / failing query doesn't disappear silently.
  let announcements: Awaited<ReturnType<typeof announcementRepository.listVisible>> = [];
  let announcementsError: string | null = null;
  let totalAnnouncementsInDb = 0;
  let allAnnouncementsRaw: {
    id: string;
    titleEn: string;
    isActive: boolean;
    startsAt: Date | null;
    endsAt: Date | null;
    targetRoles: Role[];
    targetBusinessLineIds: string[];
  }[] = [];
  if (session?.user) {
    try {
      announcements = await announcementRepository.listVisible({
        role: session.user.role,
        businessLineId: session.user.businessLineId,
      });
    } catch (err) {
      announcementsError = (err as Error).message ?? "Unknown error";
    }
    totalAnnouncementsInDb = await prisma.announcement.count().catch(() => 0);
    // Temporary diagnostic: pull the raw rows so any user can see why a row
    // didn't match. Will be removed once banner visibility is sorted.
    allAnnouncementsRaw = (await prisma.announcement
      .findMany({
        select: {
          id: true,
          titleEn: true,
          isActive: true,
          startsAt: true,
          endsAt: true,
          targetRoles: true,
          targetBusinessLineIds: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      })
      .catch(() => [])) as typeof allAnnouncementsRaw;
  }

  return (
    <div className="space-y-6">
      {announcements.length > 0 ? (
        <div className="space-y-3">
          {announcements.map((a) => (
            <article key={a.id} className="overflow-hidden rounded-lg border bg-card shadow-soft">
              {a.imageUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={a.imageUrl}
                  alt=""
                  className="max-h-48 w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : null}
              <div className="space-y-1 p-4">
                <h2 className="text-base font-semibold">
                  {localized(locale, a.titleEn, a.titleAr)}
                </h2>
                <p className="whitespace-pre-line text-sm text-muted-foreground">
                  {localized(locale, a.bodyEn, a.bodyAr)}
                </p>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {session?.user ? (
        <details className="rounded-md border border-dashed bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          <summary className="cursor-pointer">
            Announcement debug — visible: {announcements.length} · rows in DB:{" "}
            {totalAnnouncementsInDb}
            {announcementsError ? ` · error: ${announcementsError}` : ""}
          </summary>
          <p className="mt-2 text-[10px]">
            Your role: <strong>{session.user.role}</strong> · your businessLineId:{" "}
            <strong>{session.user.businessLineId ?? "null"}</strong>
          </p>
          <pre className="mt-2 whitespace-pre-wrap break-all text-[10px] leading-snug">
            {JSON.stringify(allAnnouncementsRaw, null, 2)}
          </pre>
        </details>
      ) : null}

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title", { name })}</h1>
        <div className="brand-underline mt-2 w-16" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-5 shadow-soft">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {t("yourReferralCode")}
          </p>
          <p className="mt-2 font-mono text-xl font-semibold">{referralCode}</p>
        </div>
        <div className="rounded-lg border bg-card p-5 shadow-soft">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("role")}</p>
          <p className="mt-2 text-xl font-semibold">{tRoles(session!.user.role)}</p>
        </div>
      </div>

      <p className="max-w-2xl text-sm text-muted-foreground">{t("phaseOne")}</p>
    </div>
  );
}
