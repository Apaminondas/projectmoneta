"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import type { TransactionResponse } from "@/types/api";

interface RevenueChartProps {
  transactions?: TransactionResponse[] | null;
  referenceYear: number;
  referenceMonth: number;
  isLoading?: boolean;
  isError?: boolean;
}

const SHORT_MONTH_NAMES = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

const emptySubscribe = () => () => {};

export function RevenueChart({
  transactions,
  referenceYear,
  referenceMonth,
  isLoading = false,
  isError = false,
}: RevenueChartProps) {
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const data = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return [];
    }

    const windowKeys: string[] = [];
    for (let offset = 11; offset >= 0; offset--) {
      const d = new Date(referenceYear, referenceMonth - 1 - offset, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      windowKeys.push(`${y}-${m}`);
    }
    const windowSet = new Set(windowKeys);

    const monthMap = new Map<string, { revenue: number; expense: number }>();
    let hasAnyInWindow = false;

    for (const t of transactions) {
      if (t.status === "CANCELED" || !t.date) continue;
      const key = t.date.slice(0, 7);
      if (!windowSet.has(key)) continue;
      hasAnyInWindow = true;
      const curr = monthMap.get(key) || { revenue: 0, expense: 0 };
      if (t.type === "INCOME") curr.revenue += t.amount;
      else curr.expense += t.amount;
      monthMap.set(key, curr);
    }

    if (!hasAnyInWindow) {
      return [];
    }

    return windowKeys.map((k) => {
      const [y, m] = k.split("-");
      const mIdx = parseInt(m, 10) - 1;
      const shortYear = y.slice(2);
      const val = monthMap.get(k) || { revenue: 0, expense: 0 };
      return {
        month: `${SHORT_MONTH_NAMES[mIdx]}/${shortYear}`,
        revenue: Math.round(val.revenue * 100) / 100,
        expense: Math.round(val.expense * 100) / 100,
      };
    });
  }, [transactions, referenceYear, referenceMonth]);

  return (
    <div className="bg-card border border-border rounded-2xl p-5 min-h-[356px] lg:min-h-[368px] flex flex-col justify-between shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-[15px] leading-5 font-semibold tracking-tight text-foreground whitespace-nowrap">
              Fluxo de Caixa
            </h2>
            <span className="text-xs px-2.5 py-1 rounded-full border border-border bg-secondary text-muted-foreground shrink-0">
              Últimos 12 Meses
            </span>
          </div>
          <p className="text-[13px] text-muted-foreground mt-1">
            Receitas vs despesas mensais consolidadas
          </p>
        </div>

        <div className="flex items-center gap-4 text-[13px]">
          <div className="flex items-center gap-2">
            <span className="w-3 h-[2px] bg-chart-2 inline-block" />
            <span className="text-muted-foreground">Receitas</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-[2px] bg-chart-3 inline-block" />
            <span className="text-muted-foreground">Despesas</span>
          </div>
        </div>
      </div>

      <div className="h-[260px] lg:h-[272px] w-full min-w-0">
        {isLoading || !isMounted ? (
          <div className="h-full w-full flex flex-col justify-end gap-3 p-2">
            <Skeleton className="h-44 w-full rounded-xl" />
            <Skeleton className="h-4 w-full rounded-lg" />
          </div>
        ) : isError ? (
          <div className="h-full w-full flex items-center justify-center text-xs text-destructive">
            Erro ao carregar série de fluxo de caixa.
          </div>
        ) : data.length === 0 ? (
          <div className="h-full w-full flex items-center justify-center border border-dashed border-border rounded-xl text-xs text-muted-foreground">
            Sem dados no período
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                axisLine={{ stroke: "var(--border)", strokeWidth: 1 }}
                tickLine={false}
                tick={{
                  fill: "var(--muted-foreground)",
                  fontSize: 12,
                  fontFamily: "var(--font-sans), sans-serif",
                }}
                dy={8}
                minTickGap={16}
              />
              <YAxis
                width={68}
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: "var(--muted-foreground)",
                  fontSize: 12,
                  fontFamily: "var(--font-sans), sans-serif",
                }}
                tickFormatter={(value) => `R$ ${Math.round(value / 1000)}k`}
              />
              <Tooltip
                cursor={{ stroke: "var(--input)", strokeWidth: 1, strokeDasharray: "2 2" }}
                contentStyle={{
                  backgroundColor: "var(--popover)",
                  border: "1px solid var(--input)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontFamily: "var(--font-sans), sans-serif",
                  color: "var(--popover-foreground)",
                  boxShadow: "none",
                }}
                labelStyle={{
                  color: "var(--foreground)",
                  fontWeight: 600,
                  marginBottom: "4px",
                }}
                itemStyle={{
                  color: "var(--popover-foreground)",
                  padding: "1px 0",
                }}
                formatter={(value: unknown, name: unknown) => [
                  `R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                  name === "revenue" ? "Receitas" : "Despesas",
                ]}
              />
              <Area
                type="linear"
                dataKey="revenue"
                name="revenue"
                isAnimationActive={false}
                stroke="var(--chart-2)"
                strokeWidth={2}
                fill="var(--chart-2)"
                fillOpacity={0.12}
                dot={false}
                activeDot={{
                  r: 4,
                  fill: "var(--chart-2)",
                  stroke: "var(--card)",
                  strokeWidth: 1.5,
                }}
              />
              <Area
                type="linear"
                dataKey="expense"
                name="expense"
                isAnimationActive={false}
                stroke="var(--chart-3)"
                strokeWidth={2}
                fill="var(--chart-3)"
                fillOpacity={0.08}
                dot={false}
                activeDot={{
                  r: 4,
                  fill: "var(--chart-3)",
                  stroke: "var(--card)",
                  strokeWidth: 1.5,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
