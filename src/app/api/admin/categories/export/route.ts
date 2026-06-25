import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { requireActor } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function csvField(value: string | number | boolean | null | undefined): string {
  const v = value === null || value === undefined ? "" : String(value);
  if (/[",\n\r]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

export const CATEGORY_CSV_COLUMNS = [
  "slug",
  "businessLineSlug",
  "nameEn",
  "nameAr",
  "descriptionEn",
  "descriptionAr",
  "sortOrder",
  "isActive",
] as const;

export async function GET(): Promise<Response> {
  const actor = await requireActor();
  if (actor.role !== Role.ADMIN) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const categories = await prisma.productCategory.findMany({
    include: { businessLine: { select: { slug: true } } },
    orderBy: [{ sortOrder: "asc" }, { nameEn: "asc" }],
    take: 5000,
  });

  const header = CATEGORY_CSV_COLUMNS.map(csvField).join(",");
  const rows = categories.map((c) =>
    [
      c.slug,
      c.businessLine.slug,
      c.nameEn,
      c.nameAr,
      c.descriptionEn ?? "",
      c.descriptionAr ?? "",
      c.sortOrder,
      c.isActive,
    ]
      .map(csvField)
      .join(","),
  );

  const csv = "﻿" + [header, ...rows].join("\r\n");
  const filename = `categories-${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
