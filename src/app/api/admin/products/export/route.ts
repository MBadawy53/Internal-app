import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { requireActor } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { COMPANY_LABELS_EN } from "@/lib/catalog/company";

export const runtime = "nodejs";

function csvField(value: string | number | bigint | boolean | null | undefined): string {
  const v = value === null || value === undefined ? "" : String(value);
  if (/[",\n\r]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

export const PRODUCT_CSV_COLUMNS = [
  "id",
  "businessLineSlug",
  "categorySlug",
  "companyName",
  "nameEn",
  "nameAr",
  "shortDescEn",
  "shortDescAr",
  "longDescEn",
  "longDescAr",
  "amountMinEgp",
  "amountMaxEgp",
  "tenureMinMonths",
  "tenureMaxMonths",
  "installmentPeriod",
  "flatInterestRatePct",
  "decliningInterestRatePct",
  "adminFeePct",
  "adminFeeMinEgp",
  "adminFeeMaxEgp",
  "insuranceRequired",
  "minDownPaymentPct",
  "earlySettlementFeePct",
  "latePaymentFeePct",
  "isActive",
] as const;

export async function GET(): Promise<Response> {
  const actor = await requireActor();
  if (actor.role !== Role.ADMIN) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const products = await prisma.product.findMany({
    include: {
      businessLine: { select: { slug: true } },
      category: { select: { slug: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  const header = PRODUCT_CSV_COLUMNS.map(csvField).join(",");
  const rows = products.map((p) =>
    [
      p.id,
      p.businessLine.slug,
      p.category.slug,
      p.company ? COMPANY_LABELS_EN[p.company] : "",
      p.nameEn,
      p.nameAr,
      p.shortDescEn,
      p.shortDescAr,
      p.longDescEn,
      p.longDescAr,
      Number(p.amountMinPiastres) / 100,
      Number(p.amountMaxPiastres) / 100,
      p.tenureMinMonths,
      p.tenureMaxMonths,
      p.installmentPeriod,
      p.flatInterestRateBps / 100,
      p.decliningInterestRateBps / 100,
      p.adminFeeBps / 100,
      Number(p.adminFeeMinPiastres) / 100,
      Number(p.adminFeeMaxPiastres) / 100,
      p.insuranceRequired,
      p.minDownPaymentBps / 100,
      p.earlySettlementFeeBps / 100,
      p.latePaymentFeeBps / 100,
      p.isActive,
    ]
      .map(csvField)
      .join(","),
  );

  // Prepend a UTF-8 BOM so Excel opens Arabic columns correctly.
  const csv = "﻿" + [header, ...rows].join("\r\n");
  const filename = `products-${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
