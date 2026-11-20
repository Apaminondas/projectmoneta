"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  TrophyIcon,
  TargetIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  MoreHorizontalIcon,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { useBudget } from "@/hooks/use-moneta-api";
import { useReferencePeriod } from "@/hooks/use-reference-period";
import { CostCenterBreakdownModal } from "@/components/dashboard/cost-center-breakdown-modal";
import { CostCenterModal } from "@/components/dashboard/cost-center-modal";
import { CostCenterDetailsModal } from "@/components/dashboard/cost-center-details-modal";
import type { CostCenter } from "@/types/api";

function CostCenterCard({
  member,
  index,
  onOpenDetails,
}: {
  member: CostCenter;
  index: number;
  onOpenDetails: (cc: CostCenter) => void;
  onEdit?: (cc: CostCenter) => void;
}) {
  const quotaPercentage = member.usagePct;
  const isOverCeiling = quotaPercentage >= 100;
  const isWarning = quotaPercentage >= 80 && quotaPercentage < 100;

  const initials = member.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenDetails(member);
        }
      }}
      onClick={() => onOpenDetails(member)}
      className="group bg-card border border-border rounded-2xl shadow-xs p-4 sm:p-5 hover:border-accent/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer transition-colors"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-secondary border border-border flex items-center justify-center text-xs font-bold text-foreground">
              {initials}
            </div>
            {index < 3 && (
              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-warning/20 flex items-center justify-center">
                <TrophyIcon className="w-3 h-3 text-warning" strokeWidth={1.5} />
              </div>
            )}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors">
              {member.name}
            </h4>
            <p className="text-xs text-muted-foreground">{member.kind || "Geral"}</p>
          </div>
        </div>
        <button
          type="button"
          aria-label={`Ações para ${member.name}`}
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetails(member);
          }}
          className="relative w-8 h-8 sm:w-7 sm:h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors after:absolute after:-inset-2"
        >
          <MoreHorizontalIcon className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Gasto Real</p>
          <p className="text-base sm:text-lg font-bold tabular-nums text-foreground">
            R$ {member.spent.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Lançamentos</p>
          <p className="text-base sm:text-lg font-bold tabular-nums text-foreground">{member.count}</p>
        </div>
      </div>

      {/* Quota progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-muted-foreground font-medium">Uso do Teto</span>
          <span
            className={cn(
              "font-medium tabular-nums",
              isOverCeiling ? "text-destructive font-bold" : isWarning ? "text-warning font-semibold" : "text-foreground"
            )}
          >
            {quotaPercentage}%
          </span>
        </div>
        <div className="h-1.5 bg-secondary rounded-lg overflow-hidden">
          <div
            className={cn(
              "h-full rounded-lg transition-all duration-300",
              isOverCeiling ? "bg-destructive" : isWarning ? "bg-warning" : "bg-accent"
            )}
            style={{ width: `${Math.min(quotaPercentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Ceiling & Change Indicator */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <span className="text-xs text-muted-foreground tabular-nums">
          Teto: R$ {member.ceiling.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </span>
        <div
          className={cn(
            "flex items-center gap-1 text-xs tabular-nums font-semibold",
            member.changePct > 0 ? "text-destructive" : member.changePct < 0 ? "text-success" : "text-muted-foreground"
          )}
        >
          {member.changePct > 0 ? (
            <TrendingUpIcon className="w-3.5 h-3.5" strokeWidth={1.5} />
          ) : member.changePct < 0 ? (
            <TrendingDownIcon className="w-3.5 h-3.5" strokeWidth={1.5} />
          ) : null}
          {member.changePct > 0 ? "+" : ""}
          {member.changePct}%
        </div>
      </div>
    </div>
  );
}

export function TeamSection() {
  const [chartLoaded, setChartLoaded] = useState(false);

  // Estados dos modais
  const [breakdownMetric, setBreakdownMetric] = useState<
    "spend" | "transactions" | "adherence" | null
  >(null);
  const [selectedCostCenterDetails, setSelectedCostCenterDetails] = useState<CostCenter | null>(
    null
  );
  const [costCenterToEdit, setCostCenterToEdit] = useState<CostCenter | null>(null);

  const { startDate, endDate, shortLabel, isReady } = useReferencePeriod();

  const { data: budget, isLoading: isLoadingBudget } = useBudget(
    { startDate, endDate },
    isReady
  );

  useEffect(() => {
    const timer = setTimeout(() => setChartLoaded(true), 400);
    return () => clearTimeout(timer);
  }, []);

  const costCenters = budget?.costCenters || [];
  const totalRevenue = budget?.consolidatedSpend ?? 0;
  const totalDeals = budget?.transactionCount ?? 0;
  const avgQuotaAttainment = budget?.avgCeilingAdherence ?? 0;
  const adherenceStatus =
    avgQuotaAttainment > 100
      ? { label: "Acima do limite", colorClass: "text-destructive" }
      : avgQuotaAttainment >= 90
      ? { label: "Próximo do limite", colorClass: "text-warning" }
      : { label: "Dentro dos limites", colorClass: "text-success" };

  // Dados do gráfico comparativo dinâmicos vindos da API
  const performanceData = costCenters.map((cc) => ({
    name: cc.name.length > 14 ? cc.name.slice(0, 12) + "..." : cc.name,
    fullName: cc.name,
    revenue: Number((cc.spent / 1000).toFixed(1)),
    quota: Number((cc.ceiling / 1000).toFixed(1)),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-foreground">Orçamentos</h2>
          <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">
            Controle de gastos reais consolidados versus tetos estabelecidos por centro de custo • Referência: {shortLabel}
          </p>
        </div>
      </div>
      {/* Header stats clicáveis para Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => setBreakdownMetric("spend")}
          className="w-full text-left bg-card border border-border rounded-2xl shadow-xs p-5 hover:border-foreground/15 hover:bg-secondary/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-all duration-150 flex flex-col justify-between gap-4 cursor-pointer"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-muted-foreground truncate">
              Gasto Consolidado
            </span>
            <div className="w-8 h-8 rounded-xl bg-secondary/60 flex items-center justify-center shrink-0">
              <TargetIcon className="w-4 h-4 text-accent" strokeWidth={1.5} />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
              {isLoadingBudget ? "..." : `R$ ${totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
            </div>
            <div className="text-xs text-muted-foreground">Consolidado do período</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setBreakdownMetric("transactions")}
          className="w-full text-left bg-card border border-border rounded-2xl shadow-xs p-5 hover:border-foreground/15 hover:bg-secondary/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-all duration-150 flex flex-col justify-between gap-4 cursor-pointer"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-muted-foreground truncate">
              Total Lançamentos
            </span>
            <div className="w-8 h-8 rounded-xl bg-secondary/60 flex items-center justify-center shrink-0">
              <TrendingUpIcon className="w-4 h-4 text-chart-1" strokeWidth={1.5} />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground tabular-nums">
              {isLoadingBudget ? "..." : totalDeals}
            </div>
            <div className="text-xs text-muted-foreground">Lançamentos no mês</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setBreakdownMetric("adherence")}
          className="w-full text-left bg-card border border-border rounded-2xl shadow-xs p-5 hover:border-foreground/15 hover:bg-secondary/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-all duration-150 flex flex-col justify-between gap-4 cursor-pointer"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-muted-foreground truncate">
              Aderência Média ao Teto
            </span>
            <div className="w-8 h-8 rounded-xl bg-secondary/60 flex items-center justify-center shrink-0">
              <TrophyIcon
                className={cn(
                  "w-4 h-4",
                  isLoadingBudget ? "text-muted-foreground" : adherenceStatus.colorClass
                )}
                strokeWidth={1.5}
              />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground tabular-nums">
              {isLoadingBudget ? "..." : `${avgQuotaAttainment}%`}
            </div>
            <div
              className={cn(
                "text-xs font-medium",
                isLoadingBudget ? "text-muted-foreground" : adherenceStatus.colorClass
              )}
            >
              {isLoadingBudget ? "..." : adherenceStatus.label}
            </div>
          </div>
        </button>
      </div>

      {/* Performance chart dinâmico */}
      <div className="bg-card border border-border rounded-2xl shadow-xs p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Gasto Real vs Teto Orçamentário
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Acompanhamento comparativo por categoria (dados consolidados da API REST)
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-lg bg-chart-1" />
              <span className="text-muted-foreground">Gasto Real (R$ k)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-lg bg-muted-foreground/30" />
              <span className="text-muted-foreground">Teto (R$ k)</span>
            </div>
          </div>
        </div>

        <div className="h-[250px] w-full">
          {chartLoaded ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12, fontFamily: "var(--font-sans), sans-serif" }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12, fontFamily: "var(--font-sans), sans-serif" }}
                  tickFormatter={(value) => `R$ ${value}k`}
                  dx={-10}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontFamily: "var(--font-sans), sans-serif",
                    color: "var(--popover-foreground)",
                  }}
                  labelStyle={{ color: "var(--popover-foreground)", fontWeight: 600, marginBottom: "4px" }}
                  formatter={(value, name) => [
                    `R$ ${Number(value ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 1 })}k`,
                    name === "quota" ? "Teto Orçamentário" : "Gasto Real",
                  ]}
                />
                <Bar dataKey="quota" name="quota" fill="var(--muted-foreground)" opacity={0.35} radius={[2, 2, 0, 0]} isAnimationActive={false} />
                <Bar dataKey="revenue" name="revenue" fill="var(--chart-1)" radius={[2, 2, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full flex items-center justify-center text-xs font-medium text-muted-foreground">
              Carregando gráfico comparativo...
            </div>
          )}
        </div>
      </div>

      {/* Cost Centers Grid */}
      <div>
        <h3 className="text-base font-semibold text-foreground mb-4">Centros de Custo</h3>
        {isLoadingBudget ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card border border-border rounded-2xl shadow-xs p-5 space-y-4">
                <Skeleton className="h-8 w-32 rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-3 w-full rounded-lg" />
              </div>
            ))}
          </div>
        ) : costCenters.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl shadow-xs p-8 text-center text-xs font-medium text-muted-foreground">
            Nenhum centro de custo encontrado para o período selecionado.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {costCenters.map((member, index) => (
              <CostCenterCard
                key={member.categoryId}
                member={member}
                index={index}
                onOpenDetails={setSelectedCostCenterDetails}
                onEdit={(cc) => setCostCenterToEdit(cc)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal de Breakdown dos 3 KPIs */}
      <CostCenterBreakdownModal
        open={!!breakdownMetric}
        onOpenChange={(open) => !open && setBreakdownMetric(null)}
        metricType={breakdownMetric}
        budget={budget}
      />

      {/* Modal de Edição de Perfil do Centro de Custo */}
      <CostCenterModal
        open={!!costCenterToEdit}
        onOpenChange={(open) => !open && setCostCenterToEdit(null)}
        costCenter={costCenterToEdit}
      />

      {/* Modal de Detalhes do Centro de Custo (Alertas 80%/100%, Contatos, Lançamentos) */}
      <CostCenterDetailsModal
        open={!!selectedCostCenterDetails}
        onOpenChange={(open) => !open && setSelectedCostCenterDetails(null)}
        costCenter={selectedCostCenterDetails}
        onEdit={(cc) => {
          setSelectedCostCenterDetails(null);
          setCostCenterToEdit(cc);
        }}
      />
    </div>
  );
}
