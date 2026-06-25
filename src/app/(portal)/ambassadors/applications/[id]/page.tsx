import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AmbassadorApplicationStatus, Role } from "@prisma/client";
import { requireActor } from "@/lib/auth/session";
import { requireFeatureAccess } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { PendingApplicationCard } from "@/components/portal/PendingApplicationCard";

interface Params {
  params: Promise<{ id: string }>;
}

export default async function AmbassadorApplicationProfile({ params }: Params) {
  const actor = await requireActor();
  requireFeatureAccess(actor, "ambassadors");
  if (actor.role === Role.AMBASSADOR) redirect("/dashboard");
  const { id } = await params;

  const app = await prisma.ambassadorApplication.findUnique({
    where: { id },
    include: {
      campaign: { select: { id: true, name: true, slug: true } },
    },
  });
  if (!app) notFound();
  if (actor.role !== Role.ADMIN && app.employeeId !== actor.id) {
    redirect("/ambassadors?tab=pending");
  }

  const t = await getTranslations("ambassadors.profile");
  const tStatus = await getTranslations("ambassadors.applications.statuses");

  const statusLabel = (() => {
    try {
      return tStatus(app.status);
    } catch {
      return app.status;
    }
  })();

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">
            <Link href="/ambassadors?tab=pending" className="hover:underline">
              ← {t("backToList")}
            </Link>
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{app.name}</h1>
          <div className="brand-underline mt-2 w-16" />
        </div>
        <span className="rounded-full border bg-secondary px-3 py-1 text-xs uppercase tracking-wider">
          {statusLabel}
        </span>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardContent className="space-y-3 py-4 text-sm">
            <Field label={t("name")} value={app.name} />
            <Field label={t("phone")} value={app.phone} />
            <Field label={t("appliedAt")} value={new Date(app.createdAt).toLocaleString()} />
            <Field
              label={t("campaign")}
              value={
                app.campaign ? (
                  <Link href={`/qr`} className="text-brand-700 hover:underline">
                    {app.campaign.name}
                  </Link>
                ) : (
                  "—"
                )
              }
            />
            {app.status === AmbassadorApplicationStatus.REJECTED && app.rejectedReason ? (
              <Field label={t("rejectedReason")} value={app.rejectedReason} />
            ) : null}
            {app.status === AmbassadorApplicationStatus.APPROVED && app.acceptedAt ? (
              <Field label={t("acceptedAt")} value={new Date(app.acceptedAt).toLocaleString()} />
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-2 py-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {t("nationalId")}
            </p>
            {app.nationalIdImageUrl ? (
              <a href={app.nationalIdImageUrl} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={app.nationalIdImageUrl}
                  alt=""
                  className="w-full rounded-md border bg-white object-contain"
                />
              </a>
            ) : (
              <p className="text-sm text-muted-foreground">—</p>
            )}
            {app.nationalIdImageUrl ? (
              <a
                href={app.nationalIdImageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-brand-700 hover:underline"
              >
                {t("openFullSize")}
              </a>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {app.status === AmbassadorApplicationStatus.PENDING ||
      (app.status === AmbassadorApplicationStatus.APPROVED && !app.acceptedAt) ? (
        <PendingApplicationCard
          id={app.id}
          name={app.name}
          phone={app.phone}
          nationalIdImageUrl={null}
          createdAt={app.createdAt}
          status={app.status}
        />
      ) : null}
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
