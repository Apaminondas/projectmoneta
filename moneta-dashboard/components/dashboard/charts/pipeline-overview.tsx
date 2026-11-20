"use client";

import { useMemo, useSyncExternalStore } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { CategoryReportResponse } from "@/types/api";
import { formatCurrency } from "@/lib/adapters";

interface PipelineOverviewProps {
  report?: CategoryReportResponse | null;
  isLoading?: boolean;
  isError?: boolean;
}

const colorPalette = [
  "bg-chart-1",
  "bg-chart-2",
  "bg-chart-3",
  "bg-chart-4",
  "bg-chart-5",
];

const emptySubscribe = () => () => {};

export function PipelineOverview({
  report,
  isLoading = false,
  isError = false,
}: PipelineOverviewProps) {
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const totalExpense = report?.totalExpense ?? 0;

  const stages = useMemo(() => {
    if (!report?.categories || report.categories.length === 0 || totalExpense <= 0) {
      return [];
    }
    return [...report.categories]
      .filter((c) => c.totalExpense > 0)
      .sort((a, b) => b.totalExpense - a.totalExpense)
      .slice(0, 5)
      .map((c, i) => {
        const pct = Math.round((c.totalExpense / totalExpense) * 100);
        return {
          name: c.categoryName,
          value: pct,
          formattedAmount: formatCurrency(c.totalExpense),
          color: colorPalette[i % colorPalette.length],
        };
      });
  }, [report, totalExpense]);

  return (
    <div className="bg-card border border-border rounded-2xl p-5 lg:min-h-[368px] flex flex-col justify-between min-w-0 shadow-xs">
      <div>
        <div className="mb-4">
          <h2 className="text-[15px] leading-5 font-semibold tracking-tight text-foreground whitespace-nowrap">
            Despesas por Categoria
          </h2>
          <p className="text-[13px] text-muted-foreground mt-1">
            Distribuição real por centro de custo
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4 py-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-3/4 rounded-lg" />
                <Skeleton className="h-1.5 w-full rounded-lg" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="py-12 text-center text-xs text-destructive">
            Erro ao carregar distribuição por categoria.
          </div>
        ) : stages.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-border rounded-xl text-xs text-muted-foreground">
            Sem dados no período
          </div>
        ) : (
          <div className="space-y-3.5">
            {stages.map((stage) => (
              <div key={stage.name} className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span
                    title={stage.name}
                    className="text-sm font-normal text-foreground line-clamp-2 min-w-0"
                  >
                    {stage.name}
                  </span>
                  <div className="flex items-baseline justify-end gap-3 shrink-0 tabular-nums text-right">
                    <span className="text-[13px] text-muted-foreground">
                      {stage.formattedAmount}
                    </span>
                    <span className="text-[13px] font-semibold text-foreground w-10 text-right">
                      {stage.value}%
                    </span>
                  </div>
                </div>
                <div className="h-1.5 bg-secondary rounded-[1px] overflow-hidden">
                  <div
                    className={`h-full ${stage.color} rounded-[1px] origin-left transition-transform duration-150 ease-out`}
                    style={{
                      width: `${Math.max(3, stage.value)}%`,
                      transform: isMounted ? "scaleX(1)" : "scaleX(0)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Total pipeline value */}
      <div className="pt-3 mt-4 border-t border-border">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[13px] text-muted-foreground">
            Total Consolidado
          </span>
          <span className="text-lg font-bold tabular-nums text-foreground text-right">
            {isLoading ? "—" : formatCurrency(totalExpense)}
          </span>
        </div>
      </div>
    </div>
  );
}
