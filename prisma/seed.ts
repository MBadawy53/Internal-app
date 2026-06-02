import {
  PrismaClient,
  Role,
  ProductType,
  InstallmentPeriod,
  LeadSource,
  LeadAppStatus,
  LeadProductStatus,
} from "@prisma/client";
import * as argon2 from "argon2";
import { randomBytes } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@contact.local";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe!2026";

function makeReferralCode(prefix = "CF"): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
  let out = "";
  const bytes = randomBytes(6);
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return `${prefix}-${out}`;
}

async function hash(password: string): Promise<string> {
  return argon2.hash(password, { type: argon2.argon2id });
}

function groupId(n: number): string {
  return `C${n.toString().padStart(4, "0")}C`;
}

const businessLines = [
  {
    slug: "consumer-financing",
    nameEn: "Consumer Financing",
    nameAr: "التمويل الاستهلاكي",
    icon: "wallet",
  },
  {
    slug: "business-financing",
    nameEn: "Business Financing",
    nameAr: "تمويل الشركات",
    icon: "briefcase",
  },
  { slug: "insurance", nameEn: "Insurance", nameAr: "التأمين", icon: "shield" },
];

const productTypeBySlug: Record<string, ProductType> = {
  "consumer-financing": ProductType.PERSONAL_LOAN,
  "business-financing": ProductType.FACTORING,
  insurance: ProductType.INSURANCE_POLICY,
};

async function main() {
  console.log("🌱 Seeding Contact Financial portal…");

  // ── Business lines ──────────────────────────────────────────────────────────
  for (const bl of businessLines) {
    await prisma.businessLine.upsert({
      where: { slug: bl.slug },
      update: { nameEn: bl.nameEn, nameAr: bl.nameAr, iconKey: bl.icon, isActive: true },
      create: { slug: bl.slug, nameEn: bl.nameEn, nameAr: bl.nameAr, iconKey: bl.icon },
    });
  }
  // Deactivate any legacy business line not in the current list. We keep the
  // rows so historical data (users, products, leads) stays referentially intact.
  await prisma.businessLine.updateMany({
    where: { slug: { notIn: businessLines.map((b) => b.slug) } },
    data: { isActive: false },
  });
  const allBLs = await prisma.businessLine.findMany({ where: { isActive: true } });
  console.log(`  ✓ ${allBLs.length} business lines`);

  // ── Cosmetic cleanup: drop the dead 'flatRate' key from existing category
  // attribute arrays. The form no longer collects flat rate, the validator
  // skips it, and the new @default arrays don't include it — this just
  // brings older rows in line. Idempotent.
  await prisma.$executeRawUnsafe(
    `UPDATE "product_categories"
       SET "enabledAttributes" = array_remove("enabledAttributes", 'flatRate'),
           "requiredAttributes" = array_remove("requiredAttributes", 'flatRate')
     WHERE 'flatRate' = ANY("enabledAttributes")
        OR 'flatRate' = ANY("requiredAttributes")`,
  );

  // ── Backfill: referral_code now mirrors group_id for any user that has one.
  // Idempotent; only touches rows where the two columns disagree. Admin
  // (group_id IS NULL) keeps its previously-generated code.
  await prisma.$executeRawUnsafe(
    `UPDATE "users"
       SET "referralCode" = "groupId"
     WHERE "groupId" IS NOT NULL
       AND "referralCode" <> "groupId"`,
  );

  // ── Admin (break-glass: email-only login, no group ID) ─────────────────────
  const adminPasswordHash = await hash(ADMIN_PASSWORD);
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      email: ADMIN_EMAIL,
      passwordHash: adminPasswordHash,
      nameEn: "System Administrator",
      nameAr: "مسؤول النظام",
      role: Role.ADMIN,
      referralCode: makeReferralCode("AD"),
      mustCompleteProfile: false,
      isActive: true,
    },
  });
  console.log(`  ✓ Admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);

  // ── Per-BL: 1 owner + 1 manager + 2 employees, with group IDs ─────────────
  // Group IDs are assigned sequentially starting at C0001C.
  const sharedPasswordHash = await hash("Welcome!2026");
  let userCount = 1;
  let groupSeq = 1;

  for (const bl of allBLs) {
    const ownerGid = groupId(groupSeq++);
    const owner = await prisma.user.upsert({
      where: { groupId: ownerGid },
      update: {},
      create: {
        groupId: ownerGid,
        email: `owner.${bl.slug}@contact.local`,
        passwordHash: sharedPasswordHash,
        nameEn: `${bl.nameEn} Owner`,
        nameAr: `مسؤول ${bl.nameAr}`,
        phone: `+20100000${groupSeq.toString().padStart(4, "0")}`,
        role: Role.BUSINESS_LINE_OWNER,
        businessLineId: bl.id,
        referralCode: ownerGid,
        mustCompleteProfile: false,
      },
    });

    const managerGid = groupId(groupSeq++);
    const manager = await prisma.user.upsert({
      where: { groupId: managerGid },
      update: {},
      create: {
        groupId: managerGid,
        email: `manager.${bl.slug}@contact.local`,
        passwordHash: sharedPasswordHash,
        nameEn: `${bl.nameEn} Manager`,
        nameAr: `مدير ${bl.nameAr}`,
        phone: `+20100000${groupSeq.toString().padStart(4, "0")}`,
        role: Role.TEAM_MANAGER,
        businessLineId: bl.id,
        managerId: owner.id,
        referralCode: managerGid,
        mustCompleteProfile: false,
      },
    });

    for (let i = 1; i <= 2; i++) {
      const empGid = groupId(groupSeq++);
      await prisma.user.upsert({
        where: { groupId: empGid },
        update: {},
        create: {
          groupId: empGid,
          email: `emp${i}.${bl.slug}@contact.local`,
          passwordHash: sharedPasswordHash,
          nameEn: `${bl.nameEn} Employee ${i}`,
          nameAr: `موظف ${bl.nameAr} ${i}`,
          phone: `+20100000${groupSeq.toString().padStart(4, "0")}`,
          role: Role.EMPLOYEE,
          businessLineId: bl.id,
          managerId: manager.id,
          referralCode: empGid,
          mustCompleteProfile: false,
        },
      });
      userCount++;
    }
    userCount += 2;

    // ── Default category for this BL ──────────────────────────────────────────
    // Insurance gets its own dedicated category "Insurance" (with insurance-
    // specific attributes seeded below); other BLs get a generic "— Standard".
    const isInsurance = bl.slug === "insurance";
    const categorySlug = isInsurance ? "insurance" : `${bl.slug}-standard`;
    const category = await prisma.productCategory.upsert({
      where: { slug: categorySlug },
      update: {},
      create: {
        slug: categorySlug,
        businessLineId: bl.id,
        nameEn: isInsurance ? "Insurance" : `${bl.nameEn} — Standard`,
        nameAr: isInsurance ? "التأمين" : `${bl.nameAr} — قياسي`,
        descriptionEn: isInsurance
          ? "Insurance products with carrier-specific attributes."
          : `Standard ${bl.nameEn} category`,
        descriptionAr: isInsurance
          ? "منتجات التأمين مع خصائص خاصة بشركة التأمين."
          : `فئة ${bl.nameAr} القياسية`,
      },
    });

    // ── Sample product per BL ─────────────────────────────────────────────────
    const productExists = await prisma.product.findFirst({
      where: { businessLineId: bl.id, type: productTypeBySlug[bl.slug] },
    });
    if (!productExists) {
      await prisma.product.create({
        data: {
          businessLineId: bl.id,
          categoryId: category.id,
          type: productTypeBySlug[bl.slug] ?? ProductType.PERSONAL_LOAN,
          nameEn: `${bl.nameEn} — Standard`,
          nameAr: `${bl.nameAr} — قياسي`,
          shortDescEn: `Standard ${bl.nameEn.toLowerCase()} product.`,
          shortDescAr: `منتج قياسي لـ${bl.nameAr}.`,
          longDescEn: `A flexible ${bl.nameEn.toLowerCase()} product offered by Contact Financial Holding.`,
          longDescAr: `منتج مرن لـ${bl.nameAr} تقدمه شركة كونتكت المالية القابضة.`,
          eligibilityEn: "Egyptian national, age 21–65, stable income.",
          eligibilityAr: "مواطن مصري، السن من 21 إلى 65 سنة، دخل مستقر.",
          documentsEn: ["National ID", "Proof of income", "Utility bill"],
          documentsAr: ["بطاقة الرقم القومي", "إثبات الدخل", "إيصال مرافق"],
          amountMinPiastres: BigInt(50_000_00), // EGP 50,000
          amountMaxPiastres: BigInt(2_000_000_00), // EGP 2,000,000
          tenureMinMonths: 12,
          tenureMaxMonths: 60,
          flatInterestRateBps: 1200, // 12% flat
          decliningInterestRateBps: 2300, // 23% reducing-balance equivalent (admin-entered)
          adminFeeBps: 100, // 1%
          adminFeeMinPiastres: BigInt(500_00), // EGP 500
          adminFeeMaxPiastres: BigInt(10_000_00), // EGP 10,000
          insuranceRequired: false,
          earlySettlementFeeBps: 200, // 2%
          latePaymentFeeBps: 300, // 3%
          isFeatured: true,
          isActive: true,
        },
      });
    }
  }

  // ── Sample admin-defined attributes ────────────────────────────────────────
  const seedAttrs: Array<{
    key: string;
    nameEn: string;
    nameAr: string;
    type: "TEXT" | "NUMBER" | "BOOLEAN";
  }> = [
    {
      key: "grace-period",
      nameEn: "Grace period (days)",
      nameAr: "فترة السماح (يوم)",
      type: "NUMBER",
    },
    {
      key: "co-borrower",
      nameEn: "Co-borrower allowed",
      nameAr: "السماح بشريك في الاقتراض",
      type: "BOOLEAN",
    },
    {
      key: "disbursement-days",
      nameEn: "Disbursement (business days)",
      nameAr: "مدة الصرف (يوم عمل)",
      type: "NUMBER",
    },
    // Insurance category attributes — bound to the Insurance category below.
    {
      key: "insurance.company-name",
      nameEn: "Insurance company name",
      nameAr: "اسم شركة التأمين",
      type: "TEXT",
    },
    {
      key: "insurance.threshold-amount-egp",
      nameEn: "Threshold amount X (EGP)",
      nameAr: "قيمة الحد X (ج.م.)",
      type: "NUMBER",
    },
    {
      key: "insurance.rate-under-threshold",
      nameEn: "Insurance rate for amount under X (%)",
      nameAr: "نسبة التأمين للمبالغ الأقل من X (%)",
      type: "NUMBER",
    },
    {
      key: "insurance.rate-above-threshold",
      nameEn: "Insurance rate for amount above X (%)",
      nameAr: "نسبة التأمين للمبالغ الأكبر من X (%)",
      type: "NUMBER",
    },
    {
      key: "insurance.rate-after-5-years",
      nameEn: "Insurance rate after 5 years (%)",
      nameAr: "نسبة التأمين بعد 5 سنوات (%)",
      type: "NUMBER",
    },
    {
      key: "insurance.rate-electric",
      nameEn: "Insurance rate for electric cars (%)",
      nameAr: "نسبة التأمين للسيارات الكهربائية (%)",
      type: "NUMBER",
    },
    {
      key: "insurance.civil-liability",
      nameEn: "Civil liability",
      nameAr: "المسؤولية المدنية",
      type: "TEXT",
    },
    {
      key: "insurance.key-replacement-coverage-egp",
      nameEn: "Key replacement coverage (EGP)",
      nameAr: "تغطية استبدال المفاتيح (ج.م.)",
      type: "NUMBER",
    },
    {
      key: "insurance.road-assistance",
      nameEn: "Road assistance coverage",
      nameAr: "تغطية المساعدة على الطريق",
      type: "TEXT",
    },
  ];
  for (const a of seedAttrs) {
    await prisma.attribute.upsert({
      where: { key: a.key },
      update: { nameEn: a.nameEn, nameAr: a.nameAr, type: a.type, isActive: true },
      create: {
        key: a.key,
        nameEn: a.nameEn,
        nameAr: a.nameAr,
        type: a.type,
        isActive: true,
      },
    });
  }
  console.log(`  ✓ ${seedAttrs.length} admin attributes`);

  // ── Bind Insurance attributes to the Insurance category ─────────────────────
  // The category was created in the per-BL loop above with slug "insurance".
  const insuranceCategory = await prisma.productCategory.findUnique({
    where: { slug: "insurance" },
  });
  if (insuranceCategory) {
    const insuranceAttrKeys = [
      "insurance.company-name",
      "insurance.threshold-amount-egp",
      "insurance.rate-under-threshold",
      "insurance.rate-above-threshold",
      "insurance.rate-after-5-years",
      "insurance.rate-electric",
      "insurance.civil-liability",
      "insurance.key-replacement-coverage-egp",
      "insurance.road-assistance",
    ];
    for (let i = 0; i < insuranceAttrKeys.length; i++) {
      const attr = await prisma.attribute.findUnique({ where: { key: insuranceAttrKeys[i]! } });
      if (!attr) continue;
      await prisma.categoryAttribute.upsert({
        where: {
          categoryId_attributeId: { categoryId: insuranceCategory.id, attributeId: attr.id },
        },
        update: { sortOrder: i },
        create: { categoryId: insuranceCategory.id, attributeId: attr.id, sortOrder: i },
      });
    }
    console.log(`  ✓ Insurance category linked to ${insuranceAttrKeys.length} attributes`);

    // Repoint any products that were previously created in the now-obsolete
    // "insurance-standard" category into the new "insurance" category, then
    // soft-disable the old category so it stops appearing in dropdowns.
    const oldInsuranceStd = await prisma.productCategory.findUnique({
      where: { slug: "insurance-standard" },
    });
    if (oldInsuranceStd) {
      await prisma.product.updateMany({
        where: { categoryId: oldInsuranceStd.id },
        data: { categoryId: insuranceCategory.id },
      });
      await prisma.productCategory.update({
        where: { id: oldInsuranceStd.id },
        data: { isActive: false },
      });
    }
  }
  console.log(
    `  ✓ ${userCount}+ users (1 admin, ${allBLs.length} owners, ${allBLs.length} managers, ${allBLs.length * 2} employees)`,
  );

  // ── One unactivated employee so the first-login flow can be demoed ──────────
  const unactivatedGid = groupId(groupSeq++);
  const firstBL = allBLs[0]!;
  await prisma.user.upsert({
    where: { groupId: unactivatedGid },
    update: {},
    create: {
      groupId: unactivatedGid,
      role: Role.EMPLOYEE,
      businessLineId: firstBL.id,
      referralCode: unactivatedGid,
      mustCompleteProfile: true,
      // No email / password / name / phone — collected on first login.
    },
  });
  console.log(`  ✓ Demo first-login employee: ${unactivatedGid} (no password yet)`);

  // ── Bulk: pre-create the entire C0001C–C9999C employee code range ──────────
  // Every code in the valid format is provisioned as an unactivated employee
  // so any newly-hired employee can walk through /onboard the moment HR hands
  // them a code, without admin intervention. Business line is intentionally
  // left null — admin assigns it from /admin/users after the employee
  // activates and submits their profile.
  // `skipDuplicates` makes this re-runnable: rows already created (incl. the
  // seeded users above) are left untouched.
  const BULK_RANGE_START = 1;
  const BULK_RANGE_END = 9999;
  const bulkUsers: Array<{
    groupId: string;
    role: Role;
    referralCode: string;
    mustCompleteProfile: boolean;
    isActive: boolean;
  }> = [];
  for (let i = BULK_RANGE_START; i <= BULK_RANGE_END; i++) {
    const gid = `C${i.toString().padStart(4, "0")}C`;
    bulkUsers.push({
      groupId: gid,
      role: Role.EMPLOYEE,
      referralCode: gid,
      mustCompleteProfile: true,
      isActive: true,
    });
  }
  const bulkResult = await prisma.user.createMany({
    data: bulkUsers,
    skipDuplicates: true,
  });
  console.log(
    `  ✓ Bulk employee codes C0001C–C9999C: ${bulkResult.count} created (${
      bulkUsers.length - bulkResult.count
    } already existed)`,
  );

  console.log("  ✓ Sample products seeded for each business line");

  // ── A handful of leads in different statuses ────────────────────────────────
  const leadsBL = allBLs.find((b) => b.slug === "consumer-financing");
  const emp = await prisma.user.findUnique({
    where: { email: "emp1.consumer-financing@contact.local" },
  });
  if (leadsBL && emp) {
    const sampleLeads: Array<{
      name: string;
      phone: string;
      appStatus: LeadAppStatus;
      productStatus: LeadProductStatus;
    }> = [
      {
        name: "Ahmed Hassan",
        phone: "+201001234567",
        appStatus: LeadAppStatus.INCOMPLETE,
        productStatus: LeadProductStatus.P_INITIATE,
      },
      {
        name: "Mona Saleh",
        phone: "+201112345678",
        appStatus: LeadAppStatus.SALES,
        productStatus: LeadProductStatus.P_INITIATE,
      },
      {
        name: "Karim Adel",
        phone: "+201223456789",
        appStatus: LeadAppStatus.INVESTIGATION,
        productStatus: LeadProductStatus.P_INITIATE,
      },
      {
        name: "Salma Ibrahim",
        phone: "+201556789012",
        appStatus: LeadAppStatus.APPROVED_CLIENT,
        productStatus: LeadProductStatus.EXECUTION,
      },
    ];
    for (const l of sampleLeads) {
      const exists = await prisma.lead.findFirst({
        where: { customerPhone: l.phone, businessLineId: leadsBL.id },
      });
      if (exists) continue;
      const lead = await prisma.lead.create({
        data: {
          customerName: l.name,
          customerPhone: l.phone,
          source: LeadSource.MANUAL_ENTRY,
          businessLineId: leadsBL.id,
          ownerEmployeeId: emp.id,
          referredByEmployeeId: emp.id,
          appStatus: l.appStatus,
          productStatus: l.productStatus,
          consentGivenAt: new Date(),
        },
      });
      await prisma.leadStatusHistory.create({
        data: {
          leadId: lead.id,
          toAppStatus: l.appStatus,
          toProductStatus: l.productStatus,
          actorId: admin.id,
          note: "Seed",
        },
      });
    }
    console.log(`  ✓ ${sampleLeads.length} sample leads`);
  }

  console.log("✅ Seed complete.");

  await loadProductsFromCsv();
}

// ───────────────────────────────────────────────────────────────────────────
// Catalog loader — pulls the 200+ product catalog from data/products.csv
// on every deploy. The CSV is the source of truth: rows are upserted by id
// (so leads / quotes / campaigns / commissions keep pointing at the right
// product), and any DB product whose id isn't in the CSV is deactivated.
// Missing categories referenced by the CSV are auto-created with stub
// names so the deploy never breaks; an admin can rename them later via
// /admin/categories.
// ───────────────────────────────────────────────────────────────────────────

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

function csvBigInt(v: string, fallback = 0n): bigint {
  if (v.trim() === "") return fallback;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) throw new Error(`Invalid amount '${v}'`);
  return BigInt(Math.round(n * 100));
}

function csvBps(v: string, fallback = 0): number {
  if (v.trim() === "") return fallback;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) throw new Error(`Invalid percent '${v}'`);
  return Math.round(n * 100);
}

function csvInt(v: string): number {
  const n = Number(v);
  if (!Number.isFinite(n) || !Number.isInteger(n)) {
    throw new Error(`Invalid integer '${v}'`);
  }
  return n;
}

function csvBool(v: string, fallback = false): boolean {
  const t = v.trim().toLowerCase();
  if (t === "") return fallback;
  if (["true", "1", "yes", "y"].includes(t)) return true;
  if (["false", "0", "no", "n"].includes(t)) return false;
  throw new Error(`Invalid boolean '${v}'`);
}

function csvEnum<T extends string>(v: string, allowed: readonly T[], label: string): T {
  const u = v.trim().toUpperCase() as T;
  if (!allowed.includes(u)) {
    throw new Error(`${label} '${v}' is not one of ${allowed.join(", ")}`);
  }
  return u;
}

function humanize(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

async function loadProductsFromCsv() {
  const csvPath = path.resolve(process.cwd(), "data/products.csv");
  let text: string;
  try {
    text = await fs.readFile(csvPath, "utf8");
  } catch {
    console.log(`\nℹ️  ${csvPath} not found — skipping CSV catalog import.`);
    return;
  }

  console.log(`\n📥 Loading catalog from ${csvPath}`);
  const rows = parseCsv(text);
  if (rows.length < 2) {
    console.log("  (CSV has no data rows — nothing to import.)");
    return;
  }
  const header = rows[0]!.map((h) => h.trim());
  const idx = (name: string) => {
    const i = header.indexOf(name);
    if (i < 0) throw new Error(`Missing column: ${name}`);
    return i;
  };
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
  const blBySlug = new Map(businessLines.map((b) => [b.slug, b.id]));

  // Auto-create any (businessLine, category) pairs referenced by the CSV
  // that don't exist yet. Stub names = humanized slug; admin can rename
  // later in /admin/categories.
  const referencedCategorySlugs = new Set<string>();
  const categoryToBlSlug = new Map<string, string>();
  for (let r = 0; r < dataRows.length; r++) {
    const row = dataRows[r]!;
    const blSlug = (row[col.businessLineSlug] ?? "").trim();
    const catSlug = (row[col.categorySlug] ?? "").trim();
    if (catSlug) {
      referencedCategorySlugs.add(catSlug);
      if (blSlug) categoryToBlSlug.set(catSlug, blSlug);
    }
  }

  const existingCategories = await prisma.productCategory.findMany({
    select: { id: true, slug: true },
  });
  const catBySlug = new Map(existingCategories.map((c) => [c.slug, c.id]));
  let createdCategories = 0;
  for (const catSlug of referencedCategorySlugs) {
    if (catBySlug.has(catSlug)) continue;
    const blSlug = categoryToBlSlug.get(catSlug);
    const blId = blSlug ? blBySlug.get(blSlug) : undefined;
    if (!blId) continue; // will throw later when the row tries to use it
    const stubName = humanize(catSlug);
    const created = await prisma.productCategory.create({
      data: {
        slug: catSlug,
        businessLineId: blId,
        nameEn: stubName,
        nameAr: stubName,
      },
      select: { id: true, slug: true },
    });
    catBySlug.set(created.slug, created.id);
    createdCategories++;
  }
  if (createdCategories > 0) {
    console.log(`  + ${createdCategories} categories auto-created from CSV references`);
  }

  type Parsed = {
    rowNum: number;
    id: string;
    data: Parameters<typeof prisma.product.create>[0]["data"];
  };
  const parsed: Parsed[] = [];
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
        type: csvEnum<ProductType>(
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
        amountMinPiastres: csvBigInt(get(col.amountMinEgp)),
        amountMaxPiastres: csvBigInt(get(col.amountMaxEgp)),
        tenureMinMonths: csvInt(get(col.tenureMinMonths)),
        tenureMaxMonths: csvInt(get(col.tenureMaxMonths)),
        installmentPeriod: csvEnum<InstallmentPeriod>(
          get(col.installmentPeriod),
          Object.values(InstallmentPeriod) as InstallmentPeriod[],
          "installmentPeriod",
        ),
        flatInterestRateBps: csvBps(get(col.flatInterestRatePct)),
        decliningInterestRateBps: csvBps(get(col.decliningInterestRatePct)),
        adminFeeBps: csvBps(get(col.adminFeePct)),
        adminFeeMinPiastres: csvBigInt(get(col.adminFeeMinEgp)),
        adminFeeMaxPiastres: csvBigInt(get(col.adminFeeMaxEgp)),
        insuranceRequired: csvBool(get(col.insuranceRequired)),
        minDownPaymentBps: csvBps(get(col.minDownPaymentPct)),
        earlySettlementFeeBps: csvBps(get(col.earlySettlementFeePct)),
        latePaymentFeeBps: csvBps(get(col.latePaymentFeePct)),
        isActive: csvBool(get(col.isActive), true),
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
    console.error(`  ✗ ${errors.length} row(s) failed parsing — skipping CSV import:`);
    for (const e of errors) console.error(`    row ${e.rowNum}: ${e.error}`);
    return;
  }

  let created = 0;
  let updated = 0;
  const csvIds = new Set<string>();
  for (const p of parsed) {
    if (p.id) {
      csvIds.add(p.id);
      const existing = await prisma.product.findUnique({
        where: { id: p.id },
        select: { id: true },
      });
      if (existing) {
        await prisma.product.update({ where: { id: p.id }, data: p.data });
        updated++;
      } else {
        await prisma.product.create({ data: { id: p.id, ...p.data } });
        created++;
      }
    } else {
      const row = await prisma.product.create({ data: p.data, select: { id: true } });
      csvIds.add(row.id);
      created++;
    }
  }

  const stale = await prisma.product.updateMany({
    where: { id: { notIn: [...csvIds] }, isActive: true },
    data: { isActive: false },
  });

  console.log(
    `  ✓ catalog loaded — created=${created} updated=${updated} deactivated=${stale.count}`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
