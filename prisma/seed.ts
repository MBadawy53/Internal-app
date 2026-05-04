import { PrismaClient, Role, ProductType, LeadSource, LeadStatus } from "@prisma/client";
import * as argon2 from "argon2";
import { randomBytes } from "node:crypto";

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

const businessLines = [
  { slug: "auto-loan", nameEn: "Auto Loan", nameAr: "تمويل السيارات", icon: "car" },
  { slug: "insurance", nameEn: "Insurance", nameAr: "التأمين", icon: "shield" },
  { slug: "mortgage", nameEn: "Mortgage", nameAr: "التمويل العقاري", icon: "home" },
  { slug: "home-furniture", nameEn: "Home Furniture", nameAr: "أثاث المنزل", icon: "armchair" },
  {
    slug: "home-interior",
    nameEn: "Home Interior",
    nameAr: "تشطيبات المنزل",
    icon: "paint-bucket",
  },
  { slug: "motorcycle", nameEn: "Motorcycle", nameAr: "تمويل الدراجات النارية", icon: "bike" },
  { slug: "leasing", nameEn: "Leasing", nameAr: "التأجير التمويلي", icon: "key" },
  { slug: "factoring", nameEn: "Factoring", nameAr: "التخصيم", icon: "receipt" },
];

const productTypeBySlug: Record<string, ProductType> = {
  "auto-loan": ProductType.AUTO_LOAN,
  insurance: ProductType.INSURANCE_POLICY,
  mortgage: ProductType.MORTGAGE,
  "home-furniture": ProductType.HOME_FURNITURE,
  "home-interior": ProductType.HOME_INTERIOR,
  motorcycle: ProductType.MOTORCYCLE,
  leasing: ProductType.LEASING,
  factoring: ProductType.FACTORING,
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
  const allBLs = await prisma.businessLine.findMany();
  console.log(`  ✓ ${allBLs.length} business lines`);

  // ── Admin ───────────────────────────────────────────────────────────────────
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
      isActive: true,
    },
  });
  console.log(`  ✓ Admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);

  // ── Per-BL: 1 owner + 1 manager + 2 employees ───────────────────────────────
  const sharedPasswordHash = await hash("Welcome!2026");
  let userCount = 1;

  for (const bl of allBLs) {
    const owner = await prisma.user.upsert({
      where: { email: `owner.${bl.slug}@contact.local` },
      update: {},
      create: {
        email: `owner.${bl.slug}@contact.local`,
        passwordHash: sharedPasswordHash,
        nameEn: `${bl.nameEn} Owner`,
        nameAr: `مسؤول ${bl.nameAr}`,
        role: Role.BUSINESS_LINE_OWNER,
        businessLineId: bl.id,
        referralCode: makeReferralCode("OW"),
      },
    });

    const manager = await prisma.user.upsert({
      where: { email: `manager.${bl.slug}@contact.local` },
      update: {},
      create: {
        email: `manager.${bl.slug}@contact.local`,
        passwordHash: sharedPasswordHash,
        nameEn: `${bl.nameEn} Manager`,
        nameAr: `مدير ${bl.nameAr}`,
        role: Role.TEAM_MANAGER,
        businessLineId: bl.id,
        managerId: owner.id,
        referralCode: makeReferralCode("MG"),
      },
    });

    for (let i = 1; i <= 2; i++) {
      await prisma.user.upsert({
        where: { email: `emp${i}.${bl.slug}@contact.local` },
        update: {},
        create: {
          email: `emp${i}.${bl.slug}@contact.local`,
          passwordHash: sharedPasswordHash,
          nameEn: `${bl.nameEn} Employee ${i}`,
          nameAr: `موظف ${bl.nameAr} ${i}`,
          role: Role.EMPLOYEE,
          businessLineId: bl.id,
          managerId: manager.id,
          referralCode: makeReferralCode("EM"),
        },
      });
      userCount++;
    }
    userCount += 2;

    // ── Default category for this BL ──────────────────────────────────────────
    const categorySlug = `${bl.slug}-standard`;
    const category = await prisma.productCategory.upsert({
      where: { slug: categorySlug },
      update: {},
      create: {
        slug: categorySlug,
        businessLineId: bl.id,
        nameEn: `${bl.nameEn} — Standard`,
        nameAr: `${bl.nameAr} — قياسي`,
        descriptionEn: `Standard ${bl.nameEn} category`,
        descriptionAr: `فئة ${bl.nameAr} القياسية`,
      },
    });

    // ── Sample product per BL ─────────────────────────────────────────────────
    const productExists = await prisma.product.findFirst({
      where: { businessLineId: bl.id, type: productTypeBySlug[bl.slug] },
    });
    if (!productExists) {
      const product = await prisma.product.create({
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
          insuranceRequired: bl.slug === "auto-loan" || bl.slug === "mortgage",
          earlySettlementFeeBps: 200, // 2%
          latePaymentFeeBps: 300, // 3%
          isFeatured: true,
          isActive: true,
        },
      });

      // Sample variables (informational attributes)
      await prisma.productVariable.createMany({
        data: [
          {
            productId: product.id,
            sortOrder: 1,
            nameEn: "Grace period",
            nameAr: "فترة السماح",
            descriptionEn: "Up to 30 days from contract date before first installment.",
            descriptionAr: "حتى 30 يومًا من تاريخ التعاقد قبل أول قسط.",
          },
          {
            productId: product.id,
            sortOrder: 2,
            nameEn: "Co-borrower",
            nameAr: "شريك في الاقتراض",
            descriptionEn: "Optional. Adds to combined income calculation.",
            descriptionAr: "اختياري. يُضاف إلى احتساب الدخل المشترك.",
          },
          {
            productId: product.id,
            sortOrder: 3,
            nameEn: "Disbursement",
            nameAr: "الصرف",
            descriptionEn: "Direct bank transfer within 3 business days of approval.",
            descriptionAr: "تحويل بنكي مباشر خلال 3 أيام عمل من الموافقة.",
          },
        ],
      });
    }
  }
  console.log(`  ✓ ${userCount}+ users (1 admin, 8 owners, 8 managers, 16 employees)`);
  console.log("  ✓ Sample products seeded for each business line");

  // ── A handful of leads in different statuses ────────────────────────────────
  const autoLoanBL = allBLs.find((b) => b.slug === "auto-loan");
  const emp = await prisma.user.findUnique({ where: { email: "emp1.auto-loan@contact.local" } });
  if (autoLoanBL && emp) {
    const sampleLeads: Array<{ name: string; phone: string; status: LeadStatus }> = [
      { name: "Ahmed Hassan", phone: "+201001234567", status: LeadStatus.NEW },
      { name: "Mona Saleh", phone: "+201112345678", status: LeadStatus.CONTACTED },
      { name: "Karim Adel", phone: "+201223456789", status: LeadStatus.APPLICATION_CREATED },
      { name: "Salma Ibrahim", phone: "+201556789012", status: LeadStatus.CONTRACTED },
    ];
    for (const l of sampleLeads) {
      const exists = await prisma.lead.findFirst({
        where: { customerPhone: l.phone, businessLineId: autoLoanBL.id },
      });
      if (exists) continue;
      const lead = await prisma.lead.create({
        data: {
          customerName: l.name,
          customerPhone: l.phone,
          source: LeadSource.MANUAL_ENTRY,
          businessLineId: autoLoanBL.id,
          ownerEmployeeId: emp.id,
          referredByEmployeeId: emp.id,
          currentStatus: l.status,
          consentGivenAt: new Date(),
        },
      });
      await prisma.leadStatusHistory.create({
        data: {
          leadId: lead.id,
          fromStatus: null,
          toStatus: l.status,
          actorId: admin.id,
          note: "Seed",
        },
      });
    }
    console.log(`  ✓ ${sampleLeads.length} sample leads`);
  }

  console.log("✅ Seed complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
