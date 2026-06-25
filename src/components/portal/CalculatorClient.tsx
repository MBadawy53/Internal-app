"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { Company } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { saveQuoteAction } from "@/server/actions/quotes";
import {
  calculate,
  type CalculatorProductConfig,
  type CalculatorResult,
  CalculatorValidationError,
} from "@/lib/finance/calculator";
import {
  CC_LIMIT_HAIRCUT_BPS,
  DBR_CAP_BPS,
  maxLoanFromInstallment,
  maxMonthlyFromIncome,
  maxPerPeriodFromMonthly,
  netMonthlyIncome,
} from "@/lib/finance/affordability";
import { formatBps, formatMoney } from "@/lib/finance/money";
import type { AppLocale } from "@/lib/i18n/config";

interface ClientProduct {
  id: string;
  name: string;
  businessLineId: string;
  businessLineName: string;
  categoryId: string;
  categoryName: string;
  company: Company | null;
  amountMinPiastres: string;
  amountMaxPiastres: string;
  tenureMinMonths: number;
  tenureMaxMonths: number;
  flatInterestRateBps: number;
  decliningInterestRateBps: number;
  adminFeeBps: number;
  adminFeeMinPiastres: string;
  adminFeeMaxPiastres: string;
  insuranceRequired: boolean;
  minDownPaymentBps: number;
  earlySettlementFeeBps: number;
  latePaymentFeeBps: number;
  installmentPeriod: "MONTHLY" | "QUARTERLY" | "ANNUALLY";
}

function toConfig(p: ClientProduct): CalculatorProductConfig {
  return {
    amountMinPiastres: BigInt(p.amountMinPiastres),
    amountMaxPiastres: BigInt(p.amountMaxPiastres),
    tenureMinMonths: p.tenureMinMonths,
    tenureMaxMonths: p.tenureMaxMonths,
    flatInterestRateBps: p.flatInterestRateBps,
    decliningInterestRateBps: p.decliningInterestRateBps,
    adminFeeBps: p.adminFeeBps,
    adminFeeMinPiastres: BigInt(p.adminFeeMinPiastres),
    adminFeeMaxPiastres: BigInt(p.adminFeeMaxPiastres),
    insuranceRequired: p.insuranceRequired,
    earlySettlementFeeBps: p.earlySettlementFeeBps,
    latePaymentFeeBps: p.latePaymentFeeBps,
    installmentPeriod: p.installmentPeriod,
  };
}

const MONTHS_PER_PERIOD: Record<"MONTHLY" | "QUARTERLY" | "ANNUALLY", number> = {
  MONTHLY: 1,
  QUARTERLY: 3,
  ANNUALLY: 12,
};

function piastresFromEgp(egp: string): bigint {
  const n = Number(egp);
  if (!Number.isFinite(n) || n < 0) return 0n;
  return BigInt(Math.round(n * 100));
}

interface BusinessLineOpt {
  id: string;
  name: string;
}
interface CategoryOpt {
  id: string;
  name: string;
  businessLineId: string;
}
interface CompanyOpt {
  value: Company;
  label: string;
}

interface Props {
  products: ClientProduct[];
  businessLines: BusinessLineOpt[];
  categories: CategoryOpt[];
  companies: CompanyOpt[];
  locale: AppLocale;
  allowProductMode?: boolean;
  allowAffordabilityMode?: boolean;
  initial: {
    productId?: string;
    principal?: string;
    tenure?: string;
    invoice?: string;
    dpPercent?: string;
  };
}

export function CalculatorClient({
  products,
  businessLines,
  categories,
  companies,
  locale,
  allowProductMode = true,
  allowAffordabilityMode = true,
  initial,
}: Props) {
  const t = useTranslations("calculator");
  const tResult = useTranslations("calculator.result");
  const tErr = useTranslations("calculator.errors");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [productId, setProductId] = useState(initial.productId ?? products[0]?.id ?? "");
  const product = useMemo(() => products.find((p) => p.id === productId), [productId, products]);

  // Default to whichever mode the role can see. If both are disabled the
  // server already redirected via requireFeatureAccess("calculator").
  const initialMode: "product" | "affordability" = allowProductMode
    ? "product"
    : allowAffordabilityMode
      ? "affordability"
      : "product";
  const [mode, setMode] = useState<"product" | "affordability">(initialMode);
  const [invoice, setInvoice] = useState(initial.invoice ?? "");
  const [dpPercent, setDpPercent] = useState(initial.dpPercent ?? "");
  const [principal, setPrincipal] = useState(initial.principal ?? "");
  const [tenure, setTenure] = useState(initial.tenure ?? "");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [creditCardLimit, setCreditCardLimit] = useState("");
  const [existingInstallments, setExistingInstallments] = useState("");
  const [filterBlId, setFilterBlId] = useState("");
  const [filterCatId, setFilterCatId] = useState("");
  const [filterCompany, setFilterCompany] = useState<Company | "">("");
  const [filterInsuranceRequired, setFilterInsuranceRequired] = useState(false);
  const [filterMaxAdminFeePct, setFilterMaxAdminFeePct] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CalculatorResult | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  // Loan amount = invoice − (invoice × dp%). All number math (no BigInt here).
  const invoiceNum = Number(invoice);
  const dpNum = Number(dpPercent);
  const hasInvoice = Number.isFinite(invoiceNum) && invoiceNum > 0;
  const safeDp = Number.isFinite(dpNum) ? Math.min(Math.max(dpNum, 0), 100) : 0;
  const downPaymentEgp = hasInvoice ? Math.round(invoiceNum * safeDp) / 100 : 0;
  const loanEgpFromInvoice = hasInvoice ? Math.round(invoiceNum * (100 - safeDp)) / 100 : null;

  // When invoice + DP% are set, derive principal automatically.
  useEffect(() => {
    if (loanEgpFromInvoice !== null) {
      setPrincipal(loanEgpFromInvoice.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoice, dpPercent]);

  // When product changes, default principal/tenure to the product's min.
  // Tenor is reset on every product change because the unit (months /
  // quarters / years) follows the product's installmentPeriod.
  useEffect(() => {
    if (product) {
      if (!principal) {
        setPrincipal((Number(product.amountMinPiastres) / 100).toString());
      }
      const period = product.installmentPeriod ?? "MONTHLY";
      const minInPeriod = product.tenureMinMonths / MONTHS_PER_PERIOD[period];
      setTenure(String(minInPeriod));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const compute = () => {
    if (!product) {
      setError(tErr("selectProduct"));
      setResult(null);
      return;
    }
    // Enforce the product's minimum down payment when the user is using
    // the invoice-based flow.
    if (hasInvoice && product.minDownPaymentBps > 0) {
      const minDpPct = product.minDownPaymentBps / 100;
      if (safeDp < minDpPct) {
        setError(tErr("dp_below_min", { min: minDpPct.toFixed(2) }));
        setResult(null);
        return;
      }
    }
    setError(null);
    try {
      // In product mode the tenor input is in the product's period units
      // (months / quarters / years); the calculator wants total months.
      const periodForCalc = product.installmentPeriod ?? "MONTHLY";
      const tenureMonths = Number(tenure) * MONTHS_PER_PERIOD[periodForCalc];
      const out = calculate(
        {
          principalPiastres: piastresFromEgp(principal),
          tenureMonths,
        },
        toConfig(product),
      );
      setResult(out);
      setSavedAt(null);
    } catch (err) {
      setResult(null);
      if (err instanceof CalculatorValidationError) {
        setError(tErr(`${err.field}_${err.reason}`));
      } else {
        setError((err as Error).message);
      }
    }
  };

  // Recompute when inputs change so the result tracks edits.
  useEffect(() => {
    if (product && principal && tenure) compute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, principal, tenure, invoice, dpPercent]);

  // Keep URL in sync so links are shareable.
  useEffect(() => {
    if (!product) return;
    const sp = new URLSearchParams();
    sp.set("productId", product.id);
    if (invoice) sp.set("invoice", invoice);
    if (dpPercent) sp.set("dp", dpPercent);
    if (principal) sp.set("principal", principal);
    if (tenure) sp.set("tenure", tenure);
    const url = `/calculator?${sp.toString()}`;
    window.history.replaceState(null, "", url);
  }, [product, invoice, dpPercent, principal, tenure]);

  const onSave = () => {
    if (!product || !principal || !tenure) return;
    startTransition(async () => {
      const out = await saveQuoteAction({
        productId: product.id,
        principalEgp: Number(principal),
        tenureMonths: Number(tenure),
      });
      if (out.ok) {
        setSavedAt(Date.now());
        router.refresh();
      } else {
        setError(out.message ?? out.error);
      }
    });
  };

  const onShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  // ── Affordability mode ────────────────────────────────────────────────────
  // Net income = gross − (credit-card limit × 5%) − existing installments.
  // Max monthly installment = 50% of net income. For each active product,
  // reverse-PMT that affordable monthly over the chosen tenor at the
  // product's declining rate. Show only products where: tenor fits,
  // computed max loan ≥ product min.
  const incomeNum = Number(monthlyIncome);
  const ccLimitNum = Number(creditCardLimit);
  const existingInstNum = Number(existingInstallments);
  const tenureNum = Number(tenure);
  const safeCc = Number.isFinite(ccLimitNum) && ccLimitNum > 0 ? ccLimitNum : 0;
  const safeExisting =
    Number.isFinite(existingInstNum) && existingInstNum > 0 ? existingInstNum : 0;
  const hasAffordabilityInputs =
    Number.isFinite(incomeNum) && incomeNum > 0 && Number.isFinite(tenureNum) && tenureNum > 0;
  const grossPiastres = hasAffordabilityInputs ? BigInt(Math.round(incomeNum * 100)) : 0n;
  const ccLimitPiastres = BigInt(Math.round(safeCc * 100));
  const existingInstPiastres = BigInt(Math.round(safeExisting * 100));
  const ccHaircutPiastres = (ccLimitPiastres * BigInt(CC_LIMIT_HAIRCUT_BPS)) / 10_000n;
  const netIncomePiastres = hasAffordabilityInputs
    ? netMonthlyIncome(grossPiastres, ccLimitPiastres, existingInstPiastres)
    : 0n;
  const maxMonthlyPiastres = hasAffordabilityInputs ? maxMonthlyFromIncome(netIncomePiastres) : 0n;
  const maxAdminFeePctNum = Number(filterMaxAdminFeePct);
  const hasAdminFeeFilter =
    filterMaxAdminFeePct.trim() !== "" &&
    Number.isFinite(maxAdminFeePctNum) &&
    maxAdminFeePctNum >= 0;
  const recommendations = useMemo(() => {
    if (mode !== "affordability" || !hasAffordabilityInputs) return [];
    return products
      .map((p) => {
        if (filterBlId && p.businessLineId !== filterBlId) return null;
        if (filterCatId && p.categoryId !== filterCatId) return null;
        if (filterCompany && p.company !== filterCompany) return null;
        if (filterInsuranceRequired && !p.insuranceRequired) return null;
        if (hasAdminFeeFilter && p.adminFeeBps / 100 > maxAdminFeePctNum) return null;
        if (tenureNum < p.tenureMinMonths || tenureNum > p.tenureMaxMonths) return null;
        // Tenor (months) must be a whole number of the product's periods.
        const monthsPerPeriod = MONTHS_PER_PERIOD[p.installmentPeriod ?? "MONTHLY"];
        if (tenureNum % monthsPerPeriod !== 0) return null;
        const nPeriods = tenureNum / monthsPerPeriod;
        const minPiastres = BigInt(p.amountMinPiastres);
        const maxPiastres = BigInt(p.amountMaxPiastres);
        const maxPerPeriod = maxPerPeriodFromMonthly(
          maxMonthlyPiastres,
          p.installmentPeriod ?? "MONTHLY",
        );
        const maxLoan = maxLoanFromInstallment(
          maxPerPeriod,
          tenureNum,
          p.decliningInterestRateBps,
          p.installmentPeriod ?? "MONTHLY",
        );
        if (maxLoan < minPiastres) return null;
        const offerLoan = maxLoan > maxPiastres ? maxPiastres : maxLoan;
        // Recompute the actual per-period installment for the offered loan
        // (since we may have capped it to the product's maxPiastres).
        const periodsPerYear = 12 / monthsPerPeriod;
        const r = p.decliningInterestRateBps / 10_000 / periodsPerYear;
        let offerMonthlyPiastres = maxPerPeriod;
        if (offerLoan < maxLoan && r > 0) {
          const factor = Math.pow(1 + r, nPeriods);
          const pmt = (Number(offerLoan) * r * factor) / (factor - 1);
          offerMonthlyPiastres = BigInt(Math.round(pmt));
        } else if (offerLoan < maxLoan && r === 0) {
          offerMonthlyPiastres = offerLoan / BigInt(nPeriods);
        }
        return {
          product: p,
          offerLoanPiastres: offerLoan,
          offerMonthlyPiastres,
          maxLoanPiastres: maxLoan,
        };
      })
      .filter(
        (
          x,
        ): x is {
          product: ClientProduct;
          offerLoanPiastres: bigint;
          offerMonthlyPiastres: bigint;
          maxLoanPiastres: bigint;
        } => x !== null,
      )
      .sort((a, b) => (b.offerLoanPiastres > a.offerLoanPiastres ? 1 : -1));
  }, [
    mode,
    hasAffordabilityInputs,
    products,
    maxMonthlyPiastres,
    tenureNum,
    filterBlId,
    filterCatId,
    filterCompany,
    filterInsuranceRequired,
    hasAdminFeeFilter,
    maxAdminFeePctNum,
  ]);

  const visibleCategoriesForFilter = useMemo(
    () => (filterBlId ? categories.filter((c) => c.businessLineId === filterBlId) : categories),
    [categories, filterBlId],
  );
  // Drop a category pick that no longer belongs to the chosen business line.
  useEffect(() => {
    if (filterCatId && !visibleCategoriesForFilter.some((c) => c.id === filterCatId)) {
      setFilterCatId("");
    }
  }, [filterCatId, visibleCategoriesForFilter]);

  return (
    <div className="space-y-6">
      {/* Mode toggle — only shown when the role can see both modes. */}
      {allowProductMode && allowAffordabilityMode ? (
        <div role="tablist" className="inline-flex rounded-md border bg-secondary/40 p-1 text-sm">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "product"}
            onClick={() => setMode("product")}
            className={`rounded px-3 py-1.5 ${mode === "product" ? "bg-background font-medium shadow-sm" : "text-muted-foreground"}`}
          >
            {t("mode.product")}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "affordability"}
            onClick={() => setMode("affordability")}
            className={`rounded px-3 py-1.5 ${mode === "affordability" ? "bg-background font-medium shadow-sm" : "text-muted-foreground"}`}
          >
            {t("mode.affordability")}
          </button>
        </div>
      ) : null}

      {mode === "affordability" ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("affordability.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="aff-income">{t("affordability.income")}</Label>
                <MoneyInput id="aff-income" value={monthlyIncome} onChange={setMonthlyIncome} />
                <p className="text-xs text-muted-foreground">
                  {t("affordability.dbrHint", { pct: (DBR_CAP_BPS / 100).toFixed(0) })}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="aff-tenure">{t("tenure")}</Label>
                <Input
                  id="aff-tenure"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  step="1"
                  value={tenure}
                  onChange={(e) => setTenure(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="aff-cc-limit">{t("affordability.creditCardLimit")}</Label>
                <MoneyInput
                  id="aff-cc-limit"
                  value={creditCardLimit}
                  onChange={setCreditCardLimit}
                />
                <p className="text-xs text-muted-foreground">
                  {t("affordability.creditCardHint", {
                    pct: (CC_LIMIT_HAIRCUT_BPS / 100).toFixed(0),
                  })}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="aff-existing">{t("affordability.existingInstallments")}</Label>
                <MoneyInput
                  id="aff-existing"
                  value={existingInstallments}
                  onChange={setExistingInstallments}
                />
                <p className="text-xs text-muted-foreground">
                  {t("affordability.existingInstallmentsHint")}
                </p>
              </div>
            </div>

            <div className="space-y-3 rounded-md border bg-secondary/20 p-3">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t("affordability.filtersTitle")}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="aff-bl">{t("affordability.businessLine")}</Label>
                  <Select
                    id="aff-bl"
                    value={filterBlId}
                    onChange={(e) => setFilterBlId(e.target.value)}
                  >
                    <option value="">{t("affordability.any")}</option>
                    {businessLines.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="aff-cat">{t("affordability.category")}</Label>
                  <Select
                    id="aff-cat"
                    value={filterCatId}
                    onChange={(e) => setFilterCatId(e.target.value)}
                  >
                    <option value="">{t("affordability.any")}</option>
                    {visibleCategoriesForFilter.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="aff-company">{t("affordability.company")}</Label>
                  <Select
                    id="aff-company"
                    value={filterCompany}
                    onChange={(e) => setFilterCompany((e.target.value as Company) || "")}
                  >
                    <option value="">{t("affordability.any")}</option>
                    {companies.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="aff-admin-fee">{t("affordability.maxAdminFeePct")}</Label>
                  <Input
                    id="aff-admin-fee"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    value={filterMaxAdminFeePct}
                    onChange={(e) => setFilterMaxAdminFeePct(e.target.value)}
                    placeholder={t("affordability.maxAdminFeePctPlaceholder")}
                  />
                </div>
                <label className="flex items-center gap-2 text-sm sm:col-span-2">
                  <Checkbox
                    checked={filterInsuranceRequired}
                    onChange={(e) => setFilterInsuranceRequired(e.target.checked)}
                  />
                  <span>{t("affordability.insuranceRequiredFilter")}</span>
                </label>
              </div>
            </div>

            {hasAffordabilityInputs ? (
              <div className="space-y-2 rounded-md border bg-secondary/30 p-3 text-sm">
                <dl className="grid gap-1 text-xs">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">{t("affordability.grossIncome")}</dt>
                    <dd className="font-medium">{formatMoney(grossPiastres, locale)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">
                      {t("affordability.creditCardCut", {
                        pct: (CC_LIMIT_HAIRCUT_BPS / 100).toFixed(0),
                      })}
                    </dt>
                    <dd className="font-medium">−{formatMoney(ccHaircutPiastres, locale)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">
                      {t("affordability.existingInstallmentsCut")}
                    </dt>
                    <dd className="font-medium">−{formatMoney(existingInstPiastres, locale)}</dd>
                  </div>
                  <div className="mt-1 flex justify-between border-t pt-1">
                    <dt className="text-muted-foreground">{t("affordability.netIncome")}</dt>
                    <dd className="font-medium">{formatMoney(netIncomePiastres, locale)}</dd>
                  </div>
                </dl>
                <p>
                  <span className="text-muted-foreground">{t("affordability.maxMonthly")}:</span>{" "}
                  <strong>{formatMoney(maxMonthlyPiastres, locale)}</strong>
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("affordability.maxMonthlyExplain")}
                </p>
              </div>
            ) : null}

            {hasAffordabilityInputs ? (
              recommendations.length === 0 ? (
                <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                  {t("affordability.empty")}
                </p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {recommendations.map((rec) => (
                    <div key={rec.product.id} className="rounded-md border p-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-brand-700">
                        {rec.product.businessLineName}
                      </p>
                      <p className="mt-1 font-medium">{rec.product.name}</p>
                      <dl className="mt-2 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <dt className="text-muted-foreground">{t("affordability.offerLoan")}</dt>
                          <dd className="font-medium">
                            {formatMoney(rec.offerLoanPiastres, locale)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">
                            {t("affordability.offerMonthly")}
                          </dt>
                          <dd className="font-medium">
                            {formatMoney(rec.offerMonthlyPiastres, locale)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">{tResult("decliningRate")}</dt>
                          <dd className="font-medium">
                            {formatBps(rec.product.decliningInterestRateBps, locale)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">{t("affordability.range")}</dt>
                          <dd className="text-xs">
                            {formatMoney(BigInt(rec.product.amountMinPiastres), locale)} –{" "}
                            {formatMoney(BigInt(rec.product.amountMaxPiastres), locale)}
                          </dd>
                        </div>
                      </dl>
                      <div className="mt-3">
                        <Button asChild variant="default" size="sm">
                          <Link
                            href={`/leads/new?productId=${rec.product.id}&note=${encodeURIComponent(
                              buildAffordabilityNote({
                                income: Math.round(incomeNum),
                                tenureMonths: tenureNum,
                                offerLoanEgp: Number(rec.offerLoanPiastres) / 100,
                                offerMonthlyEgp: Number(rec.offerMonthlyPiastres) / 100,
                                locale,
                              }),
                            )}`}
                          >
                            {t("affordability.applyForLead")}
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="calc-product">{t("selectProduct")}</Label>
                <Select
                  id="calc-product"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.businessLineName} — {p.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="calc-invoice">{t("invoiceValue")}</Label>
                  <MoneyInput id="calc-invoice" value={invoice} onChange={setInvoice} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="calc-dp">{t("downPaymentPercent")}</Label>
                  <Input
                    id="calc-dp"
                    type="number"
                    inputMode="decimal"
                    min={product ? product.minDownPaymentBps / 100 : 0}
                    max={100}
                    step="0.01"
                    value={dpPercent}
                    onChange={(e) => setDpPercent(e.target.value)}
                  />
                  {product && product.minDownPaymentBps > 0 ? (
                    <p className="text-xs text-muted-foreground">
                      {t("minDownPaymentHint", {
                        min: (product.minDownPaymentBps / 100).toFixed(2),
                      })}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="calc-principal">{t("principal")}</Label>
                <MoneyInput id="calc-principal" value={principal} onChange={setPrincipal} />
                {product ? (
                  <p className="text-xs text-muted-foreground">
                    {formatMoney(BigInt(product.amountMinPiastres), locale)} —{" "}
                    {formatMoney(BigInt(product.amountMaxPiastres), locale)}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="calc-period">{t("installmentPeriod")}</Label>
                  <Select
                    id="calc-period"
                    value={product?.installmentPeriod ?? "MONTHLY"}
                    disabled
                    onChange={() => undefined}
                  >
                    <option value="MONTHLY">{t("periodMonthly")}</option>
                    <option value="QUARTERLY">{t("periodQuarterly")}</option>
                    <option value="ANNUALLY">{t("periodAnnually")}</option>
                  </Select>
                  <p className="text-xs text-muted-foreground">{t("installmentPeriodHint")}</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="calc-tenure">
                    {(() => {
                      const p = product?.installmentPeriod ?? "MONTHLY";
                      return p === "MONTHLY"
                        ? t("tenureMonths")
                        : p === "QUARTERLY"
                          ? t("tenureQuarters")
                          : t("tenureYears");
                    })()}
                  </Label>
                  <Input
                    id="calc-tenure"
                    type="number"
                    inputMode="numeric"
                    min={
                      product
                        ? product.tenureMinMonths /
                          MONTHS_PER_PERIOD[product.installmentPeriod ?? "MONTHLY"]
                        : 1
                    }
                    max={
                      product
                        ? product.tenureMaxMonths /
                          MONTHS_PER_PERIOD[product.installmentPeriod ?? "MONTHLY"]
                        : 999
                    }
                    step="1"
                    value={tenure}
                    onChange={(e) => setTenure(e.target.value)}
                  />
                  {product ? (
                    <p className="text-xs text-muted-foreground">
                      {product.tenureMinMonths /
                        MONTHS_PER_PERIOD[product.installmentPeriod ?? "MONTHLY"]}
                      –
                      {product.tenureMaxMonths /
                        MONTHS_PER_PERIOD[product.installmentPeriod ?? "MONTHLY"]}
                    </p>
                  ) : null}
                </div>
              </div>

              {error ? (
                <p
                  role="alert"
                  className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  {error}
                </p>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Button onClick={compute}>{t("calculate")}</Button>
                <Button onClick={onSave} variant="accent" disabled={pending || !result}>
                  {pending ? "…" : t("saveQuote")}
                </Button>
                <Button onClick={onShare} variant="outline" disabled={!result}>
                  {copied ? t("copied") : t("share")}
                </Button>
                <Button onClick={() => window.print()} variant="ghost" disabled={!result}>
                  ⎙
                </Button>
              </div>

              {savedAt ? <p className="text-xs text-emerald-600">{t("saved")}</p> : null}
            </CardContent>
          </Card>

          {/* Result */}
          <Card>
            <CardHeader>
              <CardTitle>{tResult("monthlyInstallment")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!result ? (
                <p className="text-sm text-muted-foreground">—</p>
              ) : (
                <>
                  <div>
                    <p className="text-3xl font-bold text-brand-700">
                      {formatMoney(result.monthlyInstallmentPiastres, locale)}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                      {tResult("monthlyInstallment")}
                    </p>
                  </div>

                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    {hasInvoice ? (
                      <Stat
                        label={tResult("downPayment")}
                        value={formatEgpNumber(downPaymentEgp, locale)}
                      />
                    ) : null}
                    <Stat
                      label={tResult("loanAmount")}
                      value={formatMoney(result.principalPiastres, locale)}
                    />
                    <Stat
                      label={tResult("adminFee")}
                      value={formatMoney(result.adminFeePiastres, locale)}
                    />
                    <Stat
                      label={tResult("totalInterest")}
                      value={formatMoney(result.totalInterestPiastres, locale)}
                    />
                    <Stat
                      label={tResult("totalPayable")}
                      value={formatMoney(result.totalPayablePiastres, locale)}
                    />
                    <Stat
                      label={tResult("flatRate")}
                      value={formatBps(result.equivalentFlatRateBps, locale)}
                    />
                    <Stat
                      label={tResult("decliningRate")}
                      value={formatBps(result.decliningInterestRateBps, locale)}
                    />
                    <Stat
                      label={tResult("insurance")}
                      value={result.insuranceRequired ? "✓" : "—"}
                    />
                    <Stat
                      label={tResult("earlySettlement")}
                      value={formatBps(result.earlySettlementFeeBps, locale)}
                    />
                    <Stat
                      label={tResult("latePayment")}
                      value={formatBps(result.latePaymentFeeBps, locale)}
                    />
                  </dl>
                </>
              )}
            </CardContent>
          </Card>

          {/* Amortization */}
          {result ? (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>{tResult("amortization")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                        <th className="px-2 py-2">{tResult("month")}</th>
                        <th className="px-2 py-2">{tResult("installment")}</th>
                        <th className="px-2 py-2">{tResult("interestPart")}</th>
                        <th className="px-2 py-2">{tResult("principalPart")}</th>
                        <th className="px-2 py-2">{tResult("remainingBalance")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.amortization.map((row) => (
                        <tr key={row.month} className="border-b last:border-0">
                          <td className="px-2 py-1.5 font-mono text-xs">{row.month}</td>
                          <td className="px-2 py-1.5">
                            {formatMoney(row.installmentPiastres, locale)}
                          </td>
                          <td className="px-2 py-1.5">
                            {formatMoney(row.interestPiastres, locale)}
                          </td>
                          <td className="px-2 py-1.5">
                            {formatMoney(row.principalPiastres, locale)}
                          </td>
                          <td className="px-2 py-1.5">
                            {formatMoney(row.remainingPrincipalPiastres, locale)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}
    </div>
  );
}

function formatEgpNumber(egp: number, locale: AppLocale): string {
  const intlLocale = locale === "ar" ? "ar-EG" : "en-EG";
  return new Intl.NumberFormat(intlLocale, {
    style: "currency",
    currency: "EGP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(egp);
}

function buildAffordabilityNote(input: {
  income: number;
  tenureMonths: number;
  offerLoanEgp: number;
  offerMonthlyEgp: number;
  locale: AppLocale;
}): string {
  const intlLocale = input.locale === "ar" ? "ar-EG" : "en-EG";
  const fmt = (n: number) =>
    new Intl.NumberFormat(intlLocale, { maximumFractionDigits: 0 }).format(n);
  if (input.locale === "ar") {
    return `(الدخل ${fmt(input.income)} ج.م. شهريًا)`;
  }
  return `(income ${fmt(input.income)} EGP/month)`;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  );
}
