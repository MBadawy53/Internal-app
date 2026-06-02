"use server";

import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";
import { requireActor } from "@/lib/auth/session";
import { ForbiddenError } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export type BulkImportRowResult =
  | { row: number; ok: true; action: "created" | "updated"; categoryId: string }
  | { row: number; ok: false; error: string };

export type BulkImportState =
  | {
      ok: true;
      created: number;
      updated: number;
      results: BulkImportRowResult[];
    }
  | { ok: false; message: string };

export type PurgeInactiveState =
  | {
      ok: true;
      deleted: number;
      skipped: Array<{ slug: string; nameEn: string; productCount: number }>;
    }
  | { ok: false; message: string };

export async function purgeInactiveCategoriesAction(
  _prev: PurgeInactiveState | null,
  _fd: FormData,
): Promise<PurgeInactiveState> {
  const actor = await requireActor();
  if (actor.role !== Role.ADMIN) throw new ForbiddenError("Admin only");

  const inactive = await prisma.productCategory.findMany({
    where: { isActive: false },
    select: {
      id: true,
      slug: true,
      nameEn: true,
      _count: { select: { products: true } },
    },
  });

  const deletable = inactive.filter((c) => c._count.products === 0);
  const skipped = inactive
    .filter((c) => c._count.products > 0)
    .map((c) => ({ slug: c.slug, nameEn: c.nameEn, productCount: c._count.products }));

  let deleted = 0;
  if (deletable.length > 0) {
    const result = await prisma.$transaction(async (tx) => {
      await tx.categoryAttribute.deleteMany({
        where: { categoryId: { in: deletable.map((c) => c.id) } },
      });
      const del = await tx.productCategory.deleteMany({
        where: { id: { in: deletable.map((c) => c.id) } },
      });
      return del.count;
    });
    deleted = result;
  }

  if (deleted > 0) {
    revalidatePath("/admin/categories");
    revalidatePath("/catalog");
    logger.info({ deleted, skipped: skipped.length }, "categories.purge_inactive");
  }

  return { ok: true, deleted, skipped };
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
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
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

function toInt(v: string, fallback: number): number {
  if (v === "") return fallback;
  const n = Number(v);
  if (!Number.isFinite(n) || !Number.isInteger(n)) throw new Error(`Invalid integer '${v}'`);
  return n;
}

function toBool(v: string, fallback: boolean): boolean {
  const t = v.trim().toLowerCase();
  if (t === "") return fallback;
  if (["true", "1", "yes", "y"].includes(t)) return true;
  if (["false", "0", "no", "n"].includes(t)) return false;
  throw new Error(`Invalid boolean '${v}'`);
}

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

const REQUIRED_HEADERS = [
  "slug",
  "businessLineSlug",
  "nameEn",
  "nameAr",
  "descriptionEn",
  "descriptionAr",
  "sortOrder",
  "isActive",
] as const;

export async function bulkImportCategoriesAction(
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

  const businessLines = await prisma.businessLine.findMany({ select: { id: true, slug: true } });
  const existingCategories = await prisma.productCategory.findMany({
    select: { id: true, slug: true },
  });
  const blBySlug = new Map(businessLines.map((b) => [b.slug, b.id]));
  const categoryBySlug = new Map(existingCategories.map((c) => [c.slug, c.id]));

  const results: BulkImportRowResult[] = [];
  let created = 0;
  let updated = 0;

  for (let r = 0; r < dataRows.length; r++) {
    const row = dataRows[r]!;
    const rowNum = r + 2;
    try {
      const get = (name: string) => (row[idx(name)] ?? "").trim();

      const slug = get("slug");
      if (!slug) throw new Error("slug is required");
      if (!slugRegex.test(slug)) throw new Error(`slug '${slug}' must be kebab-case`);

      const blSlug = get("businessLineSlug");
      const blId = blBySlug.get(blSlug);
      if (!blId) throw new Error(`Unknown businessLineSlug '${blSlug}'`);

      const nameEn = get("nameEn");
      const nameAr = get("nameAr");
      if (!nameEn || !nameAr) throw new Error("nameEn / nameAr required");
      if (nameEn.length > 120 || nameAr.length > 120) {
        throw new Error("nameEn / nameAr must be ≤ 120 chars");
      }

      const descriptionEn = get("descriptionEn") || null;
      const descriptionAr = get("descriptionAr") || null;
      const sortOrder = toInt(get("sortOrder"), 0);
      if (sortOrder < 0) throw new Error("sortOrder must be ≥ 0");
      const isActive = toBool(get("isActive"), true);

      const existingId = categoryBySlug.get(slug);
      if (existingId) {
        const updatedRow = await prisma.productCategory.update({
          where: { id: existingId },
          data: {
            nameEn,
            nameAr,
            descriptionEn,
            descriptionAr,
            sortOrder,
            isActive,
            businessLine: { connect: { id: blId } },
            updatedById: actor.id,
          },
          select: { id: true },
        });
        results.push({ row: rowNum, ok: true, action: "updated", categoryId: updatedRow.id });
        updated++;
      } else {
        const createdRow = await prisma.productCategory.create({
          data: {
            slug,
            nameEn,
            nameAr,
            descriptionEn,
            descriptionAr,
            sortOrder,
            isActive,
            businessLine: { connect: { id: blId } },
            createdById: actor.id,
            updatedById: actor.id,
          },
          select: { id: true, slug: true },
        });
        categoryBySlug.set(createdRow.slug, createdRow.id);
        results.push({ row: rowNum, ok: true, action: "created", categoryId: createdRow.id });
        created++;
      }
    } catch (err) {
      const msg = (err as Error).message ?? "Unknown error";
      results.push({ row: rowNum, ok: false, error: msg });
    }
  }

  if (created + updated > 0) {
    revalidatePath("/admin/categories");
    revalidatePath("/catalog");
  }
  if (results.every((r) => !r.ok)) {
    logger.warn({ count: results.length }, "categories.bulk_import.all_failed");
  }
  return { ok: true, created, updated, results };
}
