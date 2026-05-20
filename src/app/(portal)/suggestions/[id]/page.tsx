import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Role, SuggestionStatus } from "@prisma/client";
import { requireActor } from "@/lib/auth/session";
import { requireFeatureAccess } from "@/lib/auth/permissions";
import { suggestionRepository } from "@/server/repositories/suggestion.repository";
import { localized } from "@/lib/i18n/localized";
import type { AppLocale } from "@/lib/i18n/config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SuggestionForm } from "@/components/portal/SuggestionForm";
import { SuggestionStatusForm } from "@/components/portal/SuggestionStatusForm";
import { DeleteButton } from "@/components/portal/DeleteButton";
import {
  deleteOwnSuggestionAction,
  deleteSuggestionSafeAction,
} from "@/server/actions/suggestions";

const STATUS_TONE: Record<SuggestionStatus, string> = {
  NEW: "bg-secondary text-secondary-foreground",
  UNDER_REVIEW: "bg-amber-50 text-amber-800",
  ACCEPTED: "bg-emerald-50 text-emerald-700",
  IMPLEMENTED: "bg-brand-50 text-brand-700",
  REJECTED: "bg-muted text-muted-foreground",
};

export default async function SuggestionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await requireActor();
  requireFeatureAccess(actor, "suggestions");
  const { id } = await params;
  const s = await suggestionRepository.findById(id);
  if (!s) notFound();

  const isAdmin = actor.role === Role.ADMIN;
  const isMine = s.submitterId === actor.id;
  if (!isAdmin && !isMine) notFound();

  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("suggestions");
  const tStatus = await getTranslations("suggestions.statuses");
  const tCat = await getTranslations("suggestions.categories");
  const dateFmt = (d: Date) => new Date(d).toLocaleString(locale === "ar" ? "ar-EG" : "en-EG");

  const canEdit = isMine && s.status === SuggestionStatus.NEW;
  const submitter = s.submitter
    ? localized(locale, s.submitter.nameEn ?? "", s.submitter.nameAr ?? "")
    : "";

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{s.title}</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              {tCat(s.category)} · {dateFmt(s.createdAt)}
              {submitter ? ` · ${submitter}` : ""}
            </p>
          </div>
          <span
            className={
              "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider " +
              STATUS_TONE[s.status]
            }
          >
            {tStatus(s.status)}
          </span>
        </div>
        <div className="brand-underline mt-2 w-16" />
      </header>

      {canEdit ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("editTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <SuggestionForm
              mode="edit"
              suggestionId={s.id}
              initial={{ title: s.title, body: s.body, category: s.category }}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="whitespace-pre-wrap text-sm">{s.body}</p>
            {s.attachmentUrl ? (
              <a
                href={s.attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.attachmentUrl}
                  alt=""
                  className="max-h-64 rounded-md border"
                  referrerPolicy="no-referrer"
                />
              </a>
            ) : null}
          </CardContent>
        </Card>
      )}

      {s.adminResponse ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("adminResponse")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{s.adminResponse}</p>
            {s.adminResponseAt && s.adminResponseBy ? (
              <p className="mt-2 text-xs text-muted-foreground">
                {localized(locale, s.adminResponseBy.nameEn ?? "", s.adminResponseBy.nameAr ?? "")}{" "}
                · {dateFmt(s.adminResponseAt)}
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {isAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("adminPanel")}</CardTitle>
          </CardHeader>
          <CardContent>
            <SuggestionStatusForm
              suggestionId={s.id}
              initial={{ status: s.status, adminResponse: s.adminResponse }}
            />
          </CardContent>
        </Card>
      ) : null}

      <div className="flex items-center justify-between">
        <Link href="/suggestions" className="text-xs text-muted-foreground hover:underline">
          ← {t("backToList")}
        </Link>
        {isAdmin ? (
          <DeleteButton action={deleteSuggestionSafeAction.bind(null, s.id)} />
        ) : canEdit ? (
          <DeleteButton action={deleteOwnSuggestionAction.bind(null, s.id)} />
        ) : null}
      </div>
    </div>
  );
}
