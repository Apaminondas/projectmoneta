"use client";

import { useMemo } from "react";
import { MetricCard } from "@/components/dashboard/metric-card";
import { RevenueChart } from "@/components/dashboard/charts/revenue-chart";
import { PipelineOverview } from "@/components/dashboard/charts/pipeline-overview";
import { RecentDeals } from "@/components/dashboard/recent-deals";
import { TopPerformers } from "@/components/dashboard/top-performers";
import { DollarSignIcon, TrendingUpIcon, WalletIcon, TargetIcon, AlertCircleIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useMonthlySummary, useTransactions, useCategoryReport } from "@/hooks/use-moneta-api";
import { useReferencePeriod } from "@/hooks/use-reference-period";
import {
  adaptMonthlySummaryToKpis,
  adaptTransactionsToRecentDeals,
  adaptCategoryReportToPerformers,
} from "@/lib/adapters";
import type { Section } from "@/app/page";

export function OverviewSection({
  onNavigate,
}: {
  onNavigate?: (section: Section) => void;
} = {}) {
  const {
    year,
    month,
    prevYear,
    prevMonth,
    startDate,
    endDate,
    shortLabel,
    isPartialCurrentMonth,
    partialMonthBadgeLabel,
    isReady,
  } = useReferencePeriod();
  const twelveMonthsStart = useMemo(() => {
    const d = new Date(year, month - 1 - 11, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}-01`;
  }, [year, month]);

  const { data: summary, isError: isErrorSummary } = useMonthlySummary(year, month, isReady);
  const { data: prevSummary } = useMonthlySummary(prevYear, prevMonth, isReady);
  const {
    data: transactions,
    isLoading: isLoadingTransactions,
    isError: isErrorTransactions,
  } = useTransactions({ startDate: twelveMonthsStart, endDate }, isReady);
  const {
    data: categoryReport,
    isLoading: isLoadingCategories,
    isError: isErrorCategories,
  } = useCategoryReport(startDate, endDate, isReady);

  const periodTransactions = useMemo(() => {
    if (!transactions) return undefined;
    return transactions.filter((t) => t.date >= startDate && t.date <= endDate);
  }, [transactions, startDate, endDate]);

  const prevPeriodTransactions = useMemo(() => {
    if (!transactions) return undefined;
    const prevPrefix = `${prevYear}-${String(prevMonth).padStart(2, "0")}-`;
    return transactions.filter((t) => t.date.startsWith(prevPrefix));
  }, [transactions, prevYear, prevMonth]);

  const kpis = useMemo(
    () => adaptMonthlySummaryToKpis(summary, prevSummary),
    [summary, prevSummary]
  );
  const recentDeals = useMemo(
    () => adaptTransactionsToRecentDeals(periodTransactions),
    [periodTransactions]
  );
  const topPerformers = useMemo(
    () => adaptCategoryReportToPerformers(categoryReport, periodTransactions, prevPeriodTransactions),
    [categoryReport, periodTransactions, prevPeriodTransactions]
  );

  const kpiComparisonLabel = isPartialCurrentMonth
    ? "vs. mês anterior completo"
    : "vs. mês anterior";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-foreground">Visão Geral</h2>
          <p className="text-xs text-muted-foreground mt-0.5 max-w-md flex flex-wrap items-center gap-2">
            <span>
              Indicadores de fluxo de caixa e atividade corporativa • {shortLabel}
            </span>
            {isPartialCurrentMonth && partialMonthBadgeLabel && (
              <Badge variant="secondary" className="text-[11px] font-medium">
                {partialMonthBadgeLabel}
              </Badge>
            )}
          </p>
        </div>
      </div>

      {(isErrorSummary || (isErrorTransactions && isErrorCategories)) && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs text-foreground"
        >
          <AlertCircleIcon className="w-4 h-4 text-destructive shrink-0" />
          <span>
            Demonstração temporariamente indisponível — não foi possível conectar à API do Moneta. Tente novamente em instantes.
          </span>
        </div>
      )}

      {/* KPI Cards: individual rounded cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title={kpis[0].title}
          value={kpis[0].value}
          change={kpis[0].change}
          changeType={kpis[0].changeType}
          comparisonLabel={kpiComparisonLabel}
          icon={DollarSignIcon}
          delay={0}
        />
        <MetricCard
          title={kpis[1].title}
          value={kpis[1].value}
          change={kpis[1].change}
          changeType={kpis[1].changeType}
          comparisonLabel={kpiComparisonLabel}
          icon={TrendingUpIcon}
          delay={1}
        />
        <MetricCard
          title={kpis[2].title}
          value={kpis[2].value}
          change={kpis[2].change}
          changeType={kpis[2].changeType}
          comparisonLabel={kpiComparisonLabel}
          icon={TargetIcon}
          delay={2}
        />
        <MetricCard
          title={kpis[3].title}
          subtitle={kpis[3].subtitle}
          value={kpis[3].value}
          change={kpis[3].change}
          changeType={kpis[3].changeType}
          comparisonLabel={kpiComparisonLabel}
          icon={WalletIcon}
          delay={3}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 min-w-0">
          <RevenueChart
            transactions={transactions}
            referenceYear={year}
            referenceMonth={month}
            isLoading={isLoadingTransactions}
            isError={isErrorTransactions}
          />
        </div>
        <PipelineOverview
          report={categoryReport}
          isLoading={!isReady || isLoadingCategories}
          isError={isErrorCategories}
        />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RecentDeals
          items={recentDeals}
          isLoading={isLoadingTransactions}
          isError={isErrorTransactions}
          onViewAll={() => onNavigate?.("deals")}
        />
        <TopPerformers
          performers={topPerformers}
          isLoading={!isReady || isLoadingCategories || isLoadingTransactions}
          isError={isErrorCategories || isErrorTransactions}
        />
      </div>
    </div>
  );
}
