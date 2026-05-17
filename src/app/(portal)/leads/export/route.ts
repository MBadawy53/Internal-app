import { NextResponse } from "next/server";
import { LeadSource, LeadStatus } from "@prisma/client";
import { requireActor } from "@/lib/auth/session";
import { leadService } from "@/server/services/lead.service";
import { decryptOptional } from "@/lib/crypto/aes-gcm";

export const runtime = "nodejs";

const LEAD_STATUSES = new Set<string>(Object.values(LeadStatus));
const LEAD_SOURCES = new Set<string>(Object.values(LeadSource));

/** RFC 4180 CSV field escaping. */
function csvField(value: string | null | undefined): string {
  const v = value ?? "";
  if (/[",\n\r]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

export async function GET(req: Request): Promise<Response> {
  const actor = await requireActor();
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const source = url.searchParams.get("source");
  const q = url.searchParams.get("q");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const leads = await leadService.list(actor, {
    status: status && LEAD_STATUSES.has(status) ? (status as LeadStatus) : undefined,
    source: source && LEAD_SOURCES.has(source) ? (source as LeadSource) : undefined,
    query: q ?? undefined,
    fromDate: from ? new Date(from) : undefined,
    toDate: to ? new Date(to) : undefined,
  });

  const header = [
    "id",
    "createdAt",
    "customerName",
    "customerPhone",
    "customerEmail",
    "businessLine",
    "product",
    "status",
    "source",
    "owner",
    "referredBy",
  ];
  const rows = leads.map((l) =>
    [
      l.id,
      l.createdAt.toISOString(),
      l.customerName,
      l.customerPhone,
      decryptOptional(l.customerEmailEnc) ?? "",
      l.businessLine?.nameEn ?? "",
      l.product?.nameEn ?? "",
      l.currentStatus,
      l.source,
      l.owner?.nameEn ?? "",
      l.referredBy?.nameEn ?? "",
    ]
      .map(csvField)
      .join(","),
  );
  const csv = [header.join(","), ...rows].join("\r\n");
  const filename = `leads-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
