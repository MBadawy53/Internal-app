"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DBR_CAP_BPS,
  maxLoanFromInstallment,
  maxMonthlyFromIncome,
} from "@/lib/finance/affordability";
import { formatBps, formatMoney } from "@/lib/finance/money";
import type { AppLocale } from "@/lib/i18n/config";

interface ClientProduct {
  id: string;
  name: string;
  businessLineName: string;
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
  };
}

function piastresFromEgp(egp: string): bigint {
  const n = Number(egp);
  if (!Number.isFinite(n) || n < 0) return 0n;
  return BigInt(Math.round(n * 100));
}

interface Props {
  products: ClientProduct[];
  locale: AppLocale;
  initial: {
    productId?: string;
    principal?: string;
    tenure?: string;
    invoice?: string;
    dpPercent?: string;
  };
}

export function CalculatorClient({ products, locale, initial }: Props) {
  const t = useTranslations("calculator");
  const tResult = useTranslations("calculator.result");
  const tErr = useTranslations("calculator.errors");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [productId, setProductId] = useState(initial.productId ?? products[0]?.id ?? "");
  const product = useMemo(() => products.find((p) => p.id === productId), [productId, products]);

  const [mode, setMode] = useState<"product" | "affordability">("product");
  const [invoice, setInvoice] = useState(initial.invoice ?? "");
  const [dpPercent, setDpPercent] = useState(initial.dpPercent ?? "");
  const [principal, setPrincipal] = useState(initial.principal ?? "");
  const [tenure, setTenure] = useState(initial.tenure ?? "");
  const [monthlyIncome, setMonthlyIncome] = useState("");
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

  // When product changes, default principal/tenure to the product's min if empty.
  useEffect(() => {
    if (product) {
      if (!principal) {
        setPrincipal((Number(product.amountMinPiastres) / 100).toString());
      }
      if (!tenure) {
        setTenure(product.tenureMinMonths.toString());
      }
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
      const out = calculate(
        {
          principalPiastres: piastresFromEgp(principal),
          tenureMonths: Number(tenure),
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
  // For each active product, reverse-PMT the customer's affordable monthly
  // (= 50% of income) over the chosen tenor at the product's declining rate.
  // Show only products where: tenor fits, computed max loan ≥ product min.
  const incomeNum = Number(monthlyIncome);
  const tenureNum = Number(tenure);
  const hasAffordabilityInputs =
    Number.isFinite(incomeNum) && incomeNum > 0 && Number.isFinite(tenureNum) && tenureNum > 0;
  const maxMonthlyPiastres = hasAffordabilityInputs
    ? maxMonthlyFromIncome(BigInt(Math.round(incomeNum * 100)))
    : 0n;
  const recommendations = useMemo(() => {
    if (mode !== "affordability" || !hasAffordabilityInputs) return [];
    return products
      .map((p) => {
        if (tenureNum < p.tenureMinMonths || tenureNum > p.tenureMaxMonths) return null;
        const minPiastres = BigInt(p.amountMinPiastres);
        const maxPiastres = BigInt(p.amountMaxPiastres);
        const maxLoan = maxLoanFromInstallment(
          maxMonthlyPiastres,
          tenureNum,
          p.decliningInterestRateBps,
        );
        if (maxLoan < minPiastres) return null;
        const offerLoan = maxLoan > maxPiastres ? maxPiastres : maxLoan;
        // Recompute the actual monthly for the offered loan (since we may have
        // capped it to the product's maxPiastres).
        const r = p.decliningInterestRateBps / 10_000 / 12;
        let offerMonthlyPiastres = maxMonthlyPiastres;
        if (offerLoan < maxLoan && r > 0) {
          const factor = Math.pow(1 + r, tenureNum);
          const pmt = (Number(offerLoan) * r * factor) / (factor - 1);
          offerMonthlyPiastres = BigInt(Math.round(pmt));
        } else if (offerLoan < maxLoan && r === 0) {
          offerMonthlyPiastres = offerLoan / BigInt(tenureNum);
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
  }, [mode, hasAffordabilityInputs, products, maxMonthlyPiastres, tenureNum]);

  return (
    <div className="space-y-6">
      {/* Mode toggle */}
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

      {mode === "affordability" ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("affordability.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="aff-income">{t("affordability.income")}</Label>
                <Input
                  id="aff-income"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                />
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
            </div>

            {hasAffordabilityInputs ? (
              <div className="rounded-md border bg-secondary/30 p-3 text-sm">
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
                        <Button asChild variant="outline" size="sm">
                          <Link
                            href={`/calculator?productId=${rec.product.id}&principal=${Number(rec.offerLoanPiastres) / 100}&tenure=${tenureNum}`}
                          >
                            {t("affordability.openInCalculator")}
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
                  <Input
                    id="calc-invoice"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    value={invoice}
                    onChange={(e) => setInvoice(e.target.value)}
                  />
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
                <Input
                  id="calc-principal"
                  type="number"
                  inputMode="decimal"
                  min={product ? Number(product.amountMinPiastres) / 100 : 0}
                  max={product ? Number(product.amountMaxPiastres) / 100 : undefined}
                  step="0.01"
                  value={principal}
                  onChange={(e) => setPrincipal(e.target.value)}
                />
                {product ? (
                  <p className="text-xs text-muted-foreground">
                    {formatMoney(BigInt(product.amountMinPiastres), locale)} —{" "}
                    {formatMoney(BigInt(product.amountMaxPiastres), locale)}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="calc-tenure">{t("tenure")}</Label>
                <Input
                  id="calc-tenure"
                  type="number"
                  inputMode="numeric"
                  min={product?.tenureMinMonths ?? 1}
                  max={product?.tenureMaxMonths ?? 999}
                  step="1"
                  value={tenure}
                  onChange={(e) => setTenure(e.target.value)}
                />
                {product ? (
                  <p className="text-xs text-muted-foreground">
                    {product.tenureMinMonths}–{product.tenureMaxMonths}
                  </p>
                ) : null}
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  );
}
