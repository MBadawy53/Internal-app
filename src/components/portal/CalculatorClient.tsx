"use client";

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
    customerFlat?: string;
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

  const [invoice, setInvoice] = useState(initial.invoice ?? "");
  const [dpPercent, setDpPercent] = useState(initial.dpPercent ?? "");
  const [principal, setPrincipal] = useState(initial.principal ?? "");
  const [tenure, setTenure] = useState(initial.tenure ?? "");
  const [customerFlat, setCustomerFlat] = useState(initial.customerFlat ?? "");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CalculatorResult | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  // When invoice + DP% are both set, derive principal (= invoice − DP).
  // Otherwise leave principal directly editable.
  useEffect(() => {
    const inv = Number(invoice);
    const dp = Number(dpPercent);
    if (!Number.isFinite(inv) || inv <= 0) return;
    const safeDp = Number.isFinite(dp) ? Math.min(Math.max(dp, 0), 100) : 0;
    const loan = Math.round(inv * (1 - safeDp / 100) * 100) / 100;
    setPrincipal(loan.toString());
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
    setError(null);
    try {
      const customerFlatBps =
        customerFlat.trim() === "" ? undefined : Math.round(Number(customerFlat) * 100);
      const out = calculate(
        {
          principalPiastres: piastresFromEgp(principal),
          tenureMonths: Number(tenure),
          customerFlatRateBps: customerFlatBps,
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
  }, [productId, principal, tenure, customerFlat]);

  // Keep URL in sync so links are shareable.
  useEffect(() => {
    if (!product) return;
    const sp = new URLSearchParams();
    sp.set("productId", product.id);
    if (invoice) sp.set("invoice", invoice);
    if (dpPercent) sp.set("dp", dpPercent);
    if (principal) sp.set("principal", principal);
    if (tenure) sp.set("tenure", tenure);
    if (customerFlat) sp.set("cflat", customerFlat);
    const url = `/calculator?${sp.toString()}`;
    window.history.replaceState(null, "", url);
  }, [product, invoice, dpPercent, principal, tenure, customerFlat]);

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

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Inputs */}
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
                min={0}
                max={100}
                step="0.01"
                value={dpPercent}
                onChange={(e) => setDpPercent(e.target.value)}
              />
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

          <div className="space-y-1.5">
            <Label htmlFor="calc-customer-flat">{t("customerFlatRate")}</Label>
            <Input
              id="calc-customer-flat"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={customerFlat}
              onChange={(e) => setCustomerFlat(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">{t("customerFlatRateHelp")}</p>
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
                {invoice ? (
                  <Stat
                    label={t("downPayment")}
                    value={formatMoney(
                      BigInt(
                        Math.round(
                          (((Number(invoice) || 0) * (Number(dpPercent) || 0)) / 100) * 100,
                        ),
                      ),
                      locale,
                    )}
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
                <Stat label={tResult("insurance")} value={result.insuranceRequired ? "✓" : "—"} />
                <Stat
                  label={tResult("earlySettlement")}
                  value={formatBps(result.earlySettlementFeeBps, locale)}
                />
                <Stat
                  label={tResult("latePayment")}
                  value={formatBps(result.latePaymentFeeBps, locale)}
                />
              </dl>

              {result.customerFlatRateBps !== null ? (
                <dl className="grid grid-cols-2 gap-3 rounded-md border bg-secondary/30 p-3 text-sm">
                  <Stat
                    label={tResult("customerMonthly")}
                    value={formatMoney(result.customerMonthlyInstallmentPiastres!, locale)}
                  />
                  <Stat
                    label={tResult("customerInterest")}
                    value={formatMoney(result.customerTotalInterestPiastres!, locale)}
                  />
                  <Stat
                    label={tResult("subsidy")}
                    value={formatMoney(result.subsidyTotalPiastres!, locale)}
                  />
                </dl>
              ) : null}
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
                      <td className="px-2 py-1.5">{formatMoney(row.interestPiastres, locale)}</td>
                      <td className="px-2 py-1.5">{formatMoney(row.principalPiastres, locale)}</td>
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
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  );
}
