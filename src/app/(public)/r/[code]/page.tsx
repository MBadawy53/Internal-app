import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Logo } from "@/components/shared/Logo";

interface Params {
  params: Promise<{ code: string }>;
}

export default async function PublicReferralPage({ params }: Params) {
  const { code } = await params;
  const employee = await prisma.user.findUnique({
    where: { referralCode: code },
    select: {
      id: true,
      nameEn: true,
      nameAr: true,
      photoUrl: true,
      shareConsent: true,
      isActive: true,
    },
  });

  if (!employee || !employee.isActive) notFound();

  const t = await getTranslations("public.leadCapture");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-muted/30 p-6 text-center">
      <Logo withTagline />
      <div className="max-w-md space-y-3 rounded-lg border bg-card p-8 shadow-soft">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Referral</p>
        <h1 className="text-xl font-semibold">{employee.nameEn}</h1>
        <p className="text-sm text-muted-foreground">{t("comingSoon")}</p>
      </div>
    </main>
  );
}
