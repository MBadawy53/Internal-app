 
/**
 * One-shot products bulk loader.
 *
 *   pnpm tsx scripts/import-products-from-csv.ts [path/to/products.csv]
 *
 * Behaviour:
 *   - Upsert each row by `id`. If the id exists, the product is updated in
 *     place (preserving leads/quotes/campaigns/commissions that reference
 *     it). If the id is absent in the DB, the product is created with that
 *     explicit id.
 *   - After the import, any product whose id is not in the CSV is marked
 *     isActive=false. Nothing is hard-deleted.
 *   - Blank percent / amount cells are treated as 0. Blank integers, enums,
 *     and required strings throw.
 *   - Everything runs in one interactive transaction so partial failures
 *     leave the catalog untouched.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { PrismaClient, InstallmentPeriod, ProductType } from "@prisma/client";

const prisma = new PrismaClient();

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

function toEgpPiastres(v: string, fallback = 0n): bigint {
  if (v.trim() === "") return fallback;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) throw new Error(`Invalid amount '${v}'`);
  return BigInt(Math.round(n * 100));
}

function toPctBps(v: string, fallback = 0): number {
  if (v.trim() === "") return fallback;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) throw new Error(`Invalid percent '${v}'`);
  return Math.round(n * 100);
}

function toInt(v: string): number {
  const n = Number(v);
  if (!Number.isFinite(n) || !Number.isInteger(n)) {
    throw new Error(`Invalid integer '${v}'`);
  }
  return n;
}

function toBool(v: string, fallback = false): boolean {
  const t = v.trim().toLowerCase();
  if (t === "") return fallback;
  if (["true", "1", "yes", "y"].includes(t)) return true;
  if (["false", "0", "no", "n"].includes(t)) return false;
  throw new Error(`Invalid boolean '${v}'`);
}

function toEnum<T extends string>(v: string, allowed: readonly T[], label: string): T {
  const u = v.trim().toUpperCase() as T;
  if (!allowed.includes(u)) {
    throw new Error(`${label} '${v}' is not one of ${allowed.join(", ")}`);
  }
  return u;
}

async function main() {
  const csvPath = path.resolve(process.argv[2] ?? "data/products.csv");
  console.log(`Reading ${csvPath}`);
  const text = await fs.readFile(csvPath, "utf8");
  const rows = parseCsv(text);
  if (rows.length < 2) throw new Error("CSV needs header + at least one data row");
  const header = rows[0]!.map((h) => h.trim());
  const idx = (name: string) => {
    const i = header.indexOf(name);
    if (i < 0) throw new Error(`Missing column: ${name}`);
    return i;
  };
  // Resolve column indexes once up front.
  const col = {
    id: idx("id"),
    businessLineSlug: idx("businessLineSlug"),
    categorySlug: idx("categorySlug"),
    type: idx("type"),
    nameEn: idx("nameEn"),
    nameAr: idx("nameAr"),
    shortDescEn: idx("shortDescEn"),
    shortDescAr: idx("shortDescAr"),
    longDescEn: idx("longDescEn"),
    longDescAr: idx("longDescAr"),
    amountMinEgp: idx("amountMinEgp"),
    amountMaxEgp: idx("amountMaxEgp"),
    tenureMinMonths: idx("tenureMinMonths"),
    tenureMaxMonths: idx("tenureMaxMonths"),
    installmentPeriod: idx("installmentPeriod"),
    flatInterestRatePct: idx("flatInterestRatePct"),
    decliningInterestRatePct: idx("decliningInterestRatePct"),
    adminFeePct: idx("adminFeePct"),
    adminFeeMinEgp: idx("adminFeeMinEgp"),
    adminFeeMaxEgp: idx("adminFeeMaxEgp"),
    insuranceRequired: idx("insuranceRequired"),
    minDownPaymentPct: idx("minDownPaymentPct"),
    earlySettlementFeePct: idx("earlySettlementFeePct"),
    latePaymentFeePct: idx("latePaymentFeePct"),
    isActive: idx("isActive"),
  };
  const dataRows = rows.slice(1);

  const businessLines = await prisma.businessLine.findMany({ select: { id: true, slug: true } });
  const categories = await prisma.productCategory.findMany({ select: { id: true, slug: true } });
  const blBySlug = new Map(businessLines.map((b) => [b.slug, b.id]));
  const catBySlug = new Map(categories.map((c) => [c.slug, c.id]));

  type ParsedRow = {
    rowNum: number;
    id: string;
    data: {
      businessLineId: string;
      categoryId: string;
      type: ProductType;
      nameEn: string;
      nameAr: string;
      shortDescEn: string;
      shortDescAr: string;
      longDescEn: string;
      longDescAr: string;
      amountMinPiastres: bigint;
      amountMaxPiastres: bigint;
      tenureMinMonths: number;
      tenureMaxMonths: number;
      installmentPeriod: InstallmentPeriod;
      flatInterestRateBps: number;
      decliningInterestRateBps: number;
      adminFeeBps: number;
      adminFeeMinPiastres: bigint;
      adminFeeMaxPiastres: bigint;
      insuranceRequired: boolean;
      minDownPaymentBps: number;
      earlySettlementFeeBps: number;
      latePaymentFeeBps: number;
      isActive: boolean;
    };
  };

  const parsed: ParsedRow[] = [];
  const errors: Array<{ rowNum: number; error: string }> = [];

  for (let r = 0; r < dataRows.length; r++) {
    const row = dataRows[r]!;
    const rowNum = r + 2;
    try {
      const get = (i: number) => (row[i] ?? "").trim();
      const blSlug = get(col.businessLineSlug);
      const blId = blBySlug.get(blSlug);
      if (!blId) throw new Error(`Unknown businessLineSlug '${blSlug}'`);
      const catSlug = get(col.categorySlug);
      const catId = catBySlug.get(catSlug);
      if (!catId) throw new Error(`Unknown categorySlug '${catSlug}'`);

      const data = {
        businessLineId: blId,
        categoryId: catId,
        type: toEnum<ProductType>(
          get(col.type),
          Object.values(ProductType) as ProductType[],
          "type",
        ),
        nameEn: get(col.nameEn),
        nameAr: get(col.nameAr),
        shortDescEn: get(col.shortDescEn),
        shortDescAr: get(col.shortDescAr),
        longDescEn: get(col.longDescEn),
        longDescAr: get(col.longDescAr),
        amountMinPiastres: toEgpPiastres(get(col.amountMinEgp)),
        amountMaxPiastres: toEgpPiastres(get(col.amountMaxEgp)),
        tenureMinMonths: toInt(get(col.tenureMinMonths)),
        tenureMaxMonths: toInt(get(col.tenureMaxMonths)),
        installmentPeriod: toEnum<InstallmentPeriod>(
          get(col.installmentPeriod),
          Object.values(InstallmentPeriod) as InstallmentPeriod[],
          "installmentPeriod",
        ),
        flatInterestRateBps: toPctBps(get(col.flatInterestRatePct)),
        decliningInterestRateBps: toPctBps(get(col.decliningInterestRatePct)),
        adminFeeBps: toPctBps(get(col.adminFeePct)),
        adminFeeMinPiastres: toEgpPiastres(get(col.adminFeeMinEgp)),
        adminFeeMaxPiastres: toEgpPiastres(get(col.adminFeeMaxEgp)),
        insuranceRequired: toBool(get(col.insuranceRequired)),
        minDownPaymentBps: toPctBps(get(col.minDownPaymentPct)),
        earlySettlementFeeBps: toPctBps(get(col.earlySettlementFeePct)),
        latePaymentFeeBps: toPctBps(get(col.latePaymentFeePct)),
        isActive: toBool(get(col.isActive), true),
      };

      if (!data.nameEn || !data.nameAr) throw new Error("nameEn / nameAr required");
      if (data.amountMaxPiastres < data.amountMinPiastres) {
        throw new Error("amountMaxEgp must be ≥ amountMinEgp");
      }
      if (data.tenureMaxMonths < data.tenureMinMonths) {
        throw new Error("tenureMaxMonths must be ≥ tenureMinMonths");
      }
      parsed.push({ rowNum, id: get(col.id), data });
    } catch (err) {
      errors.push({ rowNum, error: (err as Error).message });
    }
  }

  if (errors.length > 0) {
    console.error(`\n${errors.length} row(s) failed parsing — aborting:`);
    for (const e of errors) console.error(`  row ${e.rowNum}: ${e.error}`);
    process.exit(1);
  }

  console.log(`Parsed ${parsed.length} rows. Importing inside a transaction…`);

  const csvIds = new Set<string>();
  const result = await prisma.$transaction(
    async (tx) => {
      let created = 0;
      let updated = 0;
      for (const p of parsed) {
        const id = p.id;
        if (id) {
          csvIds.add(id);
          const existing = await tx.product.findUnique({ where: { id }, select: { id: true } });
          if (existing) {
            await tx.product.update({ where: { id }, data: p.data });
            updated++;
          } else {
            await tx.product.create({ data: { id, ...p.data } });
            created++;
          }
        } else {
          const row = await tx.product.create({ data: p.data, select: { id: true } });
          csvIds.add(row.id);
          created++;
        }
      }
      const stale = await tx.product.findMany({
        where: { id: { notIn: [...csvIds] }, isActive: true },
        select: { id: true, nameEn: true },
      });
      if (stale.length > 0) {
        await tx.product.updateMany({
          where: { id: { in: stale.map((s) => s.id) } },
          data: { isActive: false },
        });
      }
      return { created, updated, deactivated: stale };
    },
    { timeout: 120_000, maxWait: 30_000 },
  );

  console.log(
    `\nDone. created=${result.created} updated=${result.updated} deactivated=${result.deactivated.length}`,
  );
  if (result.deactivated.length > 0) {
    console.log("Deactivated (not present in CSV):");
    for (const d of result.deactivated) console.log(`  - ${d.nameEn} (${d.id})`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
