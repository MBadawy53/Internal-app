"use server";

import { revalidatePath } from "next/cache";
import { InstallmentPeriod, Role } from "@prisma/client";
import type { Company } from "@prisma/client";
import { companyFromName, COMPANY_LABELS_EN } from "@/lib/catalog/company";
import { requireActor } from "@/lib/auth/session";
import { ForbiddenError } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export type BulkImportRowResult =
  | { row: number; ok: true; action: "created" | "updated"; productId: string }
  | { row: number; ok: false; error: string };

export type BulkImportState =
  | {
      ok: true;
      created: number;
      updated: number;
      results: BulkImportRowResult[];
    }
  | { ok: false; message: string };

// ── Minimal RFC4180 CSV parser (no deps) ───────────────────────────────────

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  // Strip UTF-8 BOM if present.
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  while (i < text.length) {
    const c = text[i]!;
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (c === ",") {
      cur.push(field);
      field = "";
      i++;
      continue;
    }
    if (c === "\r") {
      if (text[i + 1] === "\n") i++;
      cur.push(field);
      rows.push(cur);
      cur = [];
      field = "";
      i++;
      continue;
    }
    if (c === "\n") {
      cur.push(field);
      rows.push(cur);
      cur = [];
      field = "";
      i++;
      continue;
    }
    field += c;
    i++;
  }
  if (field !== "" || cur.length > 0) {
    cur.push(field);
    rows.push(cur);
  }
  // Drop blank trailing rows.
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

function toEgpPiastres(v: string): bigint {
  if (v.trim() === "") return 0n;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) throw new Error(`Invalid amount '${v}'`);
  return BigInt(Math.round(n * 100));
}

function toPctBps(v: string): number {
  if (v.trim() === "") return 0;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) throw new Error(`Invalid percent '${v}'`);
  return Math.round(n * 100);
}

function toInt(v: string): number {
  const n = Number(v);
  if (!Number.isFinite(n) || !Number.isInteger(n)) throw new Error(`Invalid integer '${v}'`);
  return n;
}

function toBool(v: string): boolean {
  const t = v.trim().toLowerCase();
  if (["true", "1", "yes", "y"].includes(t)) return true;
  if (["false", "0", "no", "n", ""].includes(t)) return false;
  throw new Error(`Invalid boolean '${v}'`);
}

function toEnum<T extends string>(v: string, allowed: readonly T[], label: string): T {
  const u = v.trim().toUpperCase() as T;
  if (!allowed.includes(u)) {
    throw new Error(`${label} '${v}' is not one of ${allowed.join(", ")}`);
  }
  return u;
}

const REQUIRED_HEADERS = [
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

export async function bulkImportProductsAction(
  _prev: BulkImportState | null,
  fd: FormData,
): Promise<BulkImportState> {
  const actor = await requireActor();
  if (actor.role !== Role.ADMIN) throw new ForbiddenError("Admin only");

  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "No file uploaded." };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { ok: false, message: "File too large (max 5 MB)." };
  }

  let text: string;
  try {
    text = await file.text();
  } catch {
    return { ok: false, message: "Could not read the file." };
  }
  const parsed = parseCsv(text);
  if (parsed.length < 2) {
    return { ok: false, message: "CSV must include a header row and at least one data row." };
  }
  const [headerRow, ...dataRows] = parsed as [string[], ...string[][]];
  const header = headerRow.map((h) => h.trim());
  const missing = REQUIRED_HEADERS.filter((h) => !header.includes(h));
  if (missing.length > 0) {
    return { ok: false, message: `Missing columns: ${missing.join(", ")}` };
  }
  const idx = (name: string) => header.indexOf(name);

  // Pre-load BL and Category by slug to avoid N queries per row.
  const businessLines = await prisma.businessLine.findMany({ select: { id: true, slug: true } });
  const categories = await prisma.productCategory.findMany({ select: { id: true, slug: true } });
  const blBySlug = new Map(businessLines.map((b) => [b.slug, b.id]));
  const catBySlug = new Map(categories.map((c) => [c.slug, c.id]));

  const results: BulkImportRowResult[] = [];
  let created = 0;
  let updated = 0;

  for (let r = 0; r < dataRows.length; r++) {
    const row = dataRows[r]!;
    const rowNum = r + 2; // 1-based + header row
    try {
      const get = (name: string) => (row[idx(name)] ?? "").trim();

      const blId = blBySlug.get(get("businessLineSlug"));
      if (!blId) throw new Error(`Unknown businessLineSlug '${get("businessLineSlug")}'`);
      const catId = catBySlug.get(get("categorySlug"));
      if (!catId) throw new Error(`Unknown categorySlug '${get("categorySlug")}'`);

      const rawCompany = get("companyName");
      let company: Company | null;
      if (rawCompany === "") {
        company = null;
      } else {
        const matched = companyFromName(rawCompany);
        if (!matched) {
          throw new Error(
            `Unknown companyName '${rawCompany}'. Allowed: ${Object.values(COMPANY_LABELS_EN).join(", ")}`,
          );
        }
        company = matched;
      }

      const data = {
        businessLineId: blId,
        categoryId: catId,
        company,
        nameEn: get("nameEn"),
        nameAr: get("nameAr"),
        shortDescEn: get("shortDescEn"),
        shortDescAr: get("shortDescAr"),
        longDescEn: get("longDescEn"),
        longDescAr: get("longDescAr"),
        amountMinPiastres: toEgpPiastres(get("amountMinEgp")),
        amountMaxPiastres: toEgpPiastres(get("amountMaxEgp")),
        tenureMinMonths: toInt(get("tenureMinMonths")),
        tenureMaxMonths: toInt(get("tenureMaxMonths")),
        installmentPeriod: toEnum<InstallmentPeriod>(
          get("installmentPeriod"),
          Object.values(InstallmentPeriod) as InstallmentPeriod[],
          "installmentPeriod",
        ),
        flatInterestRateBps: toPctBps(get("flatInterestRatePct")),
        decliningInterestRateBps: toPctBps(get("decliningInterestRatePct")),
        adminFeeBps: toPctBps(get("adminFeePct")),
        adminFeeMinPiastres: toEgpPiastres(get("adminFeeMinEgp")),
        adminFeeMaxPiastres: toEgpPiastres(get("adminFeeMaxEgp")),
        insuranceRequired: toBool(get("insuranceRequired")),
        minDownPaymentBps: toPctBps(get("minDownPaymentPct")),
        earlySettlementFeeBps: toPctBps(get("earlySettlementFeePct")),
        latePaymentFeeBps: toPctBps(get("latePaymentFeePct")),
        isActive: toBool(get("isActive")),
      };

      // Sanity checks.
      if (!data.nameEn || !data.nameAr) throw new Error("nameEn / nameAr required");
      if (data.amountMaxPiastres < data.amountMinPiastres) {
        throw new Error("amountMaxEgp must be ≥ amountMinEgp");
      }
      if (data.tenureMaxMonths < data.tenureMinMonths) {
        throw new Error("tenureMaxMonths must be ≥ tenureMinMonths");
      }

      const id = get("id");
      if (id !== "") {
        const existing = await prisma.product.findUnique({
          where: { id },
          select: { id: true },
        });
        if (existing) {
          const product = await prisma.product.update({
            where: { id },
            data: { ...data, updatedById: actor.id },
            select: { id: true },
          });
          results.push({ row: rowNum, ok: true, action: "updated", productId: product.id });
          updated++;
        } else {
          const product = await prisma.product.create({
            data: { id, ...data, createdById: actor.id, updatedById: actor.id },
            select: { id: true },
          });
          results.push({ row: rowNum, ok: true, action: "created", productId: product.id });
          created++;
        }
      } else {
        const product = await prisma.product.create({
          data: { ...data, createdById: actor.id, updatedById: actor.id },
          select: { id: true },
        });
        results.push({ row: rowNum, ok: true, action: "created", productId: product.id });
        created++;
      }
    } catch (err) {
      const msg = (err as Error).message ?? "Unknown error";
      results.push({ row: rowNum, ok: false, error: msg });
    }
  }

  if (created + updated > 0) {
    revalidatePath("/admin/products");
    revalidatePath("/catalog");
  }
  if (results.every((r) => !r.ok)) {
    logger.warn({ count: results.length }, "products.bulk_import.all_failed");
  }
  return { ok: true, created, updated, results };
}
