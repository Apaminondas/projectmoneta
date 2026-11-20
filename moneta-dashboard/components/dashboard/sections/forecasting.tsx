"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUpIcon,
  TargetIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  ArrowRightIcon,
  RefreshCwIcon,
  PlusIcon,
  ShieldCheckIcon,
  InfoIcon,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { useForecast } from "@/hooks/use-moneta-api";
import { useReferencePeriod } from "@/hooks/use-reference-period";
import { ForecastBreakdownModal } from "@/components/dashboard/forecast-breakdown-modal";
import { RiskDetailsModal } from "@/components/dashboard/risk-details-modal";
import { MitigationPlanModal } from "@/components/dashboard/mitigation-plan-modal";
import { RiskFactorModal } from "@/components/dashboard/risk-factor-modal";
import type { RiskFactor } from "@/types/api";

interface ForecastingSectionProps {
  onNavigate?: (section: string) => void;
}

export function ForecastingSection({ onNavigate }: ForecastingSectionProps) {
  const { year, month, shortLabel, longLabel, isReady } = useReferencePeriod();
  const [timeframe, setTimeframe] = useState("T2");
  const { data: forecast, isLoading, isError, refetch, isRefetching } = useForecast(
    timeframe,
    year,
    month,
    isReady
  );

  // Modals state
  const [breakdownMetric, setBreakdownMetric] = useState<
    "forecastT2" | "accuracy" | "coverage" | "openExpenses" | null
  >(null);
  const [selectedRiskDetails, setSelectedRiskDetails] = useState<RiskFactor | null>(null);
  const [selectedRiskMitigation, setSelectedRiskMitigation] = useState<RiskFactor | null>(null);
  const [isAddRiskOpen, setIsAddRiskOpen] = useState(false);

  const kpis = forecast?.kpis;
  const projectionData = forecast?.projectionChart ?? [];
  const quarterlyData = forecast?.quarterlyForecast ?? [];
  const scenariosData = forecast?.scenarios ?? [];
  const riskFactorsList = forecast?.riskFactors ?? [];

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-foreground">Previsão de Fluxo & Saldo</h2>
          <p className="text-xs text-muted-foreground mt-0.5 max-w-md">
            Projeções financeiras de despesas e centros de custo • {shortLabel}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-[140px] h-11 sm:h-9 bg-secondary border-border text-foreground text-xs rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-foreground rounded-lg">
              <SelectItem value="T1">Trimestre T1</SelectItem>
              <SelectItem value="T2">Trimestre T2</SelectItem>
              <SelectItem value="T3">Trimestre T3</SelectItem>
              <SelectItem value="T4">Trimestre T4</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="min-h-11 sm:min-h-9 text-xs text-foreground border-border hover:bg-secondary rounded-lg"
          >
            <RefreshCwIcon data-icon="inline-start" className={isRefetching ? "animate-spin text-accent" : undefined} strokeWidth={1.5} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* KPI Summary (4 Cards do Topo com Modal de Fórmula ao Clicar) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            key: "forecastT2" as const,
            label: `Previsão ${timeframe}`,
            value: `R$ ${((kpis?.forecastT2 ?? 0) / 1000).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}k`,
            subtext: `Teto ${timeframe}: R$ ${((kpis?.forecastT2Ceiling ?? 0) / 1000).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}k`,
            icon: TargetIcon,
          },
          {
            key: "accuracy" as const,
            label: "Acurácia Histórica",
            value: kpis ? `${kpis.accuracyPct}%` : "N/D",
            subtext: "Aderência média aos tetos",
            icon: CheckCircle2Icon,
          },
          {
            key: "coverage" as const,
            label: "Cobertura de Saldo",
            value:
              kpis?.balanceCoverage !== null && kpis?.balanceCoverage !== undefined
                ? `${kpis.balanceCoverage.toLocaleString("pt-BR", {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                })} meses`
                : "N/D",
            tooltip:
              kpis?.balanceCoverage === null || kpis?.balanceCoverage === undefined
                ? "Sem despesas no período para calcular"
                : undefined,
            subtext: "Autonomia sobre despesas",
            icon: TrendingUpIcon,
          },
          {
            key: "openExpenses" as const,
            label: "Despesas em Aberto",
            value: `R$ ${((kpis?.openExpensesAmount ?? 0) / 1000).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}k`,
            subtext: `${kpis?.openExpensesCount ?? 0} despesas pendentes`,
            icon: AlertTriangleIcon,
          },
        ].map((stat) => (
          <button
            type="button"
            key={stat.label}
            onClick={() => setBreakdownMetric(stat.key)}
            className={`w-full text-left border border-border bg-card rounded-2xl shadow-xs p-5 cursor-pointer hover:border-foreground/15 hover:bg-secondary/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-all duration-150 flex flex-col justify-between gap-4 ${isLoading ? "opacity-70 animate-pulse" : "opacity-100"
              }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-sm font-medium text-muted-foreground truncate">
                  {stat.label}
                </span>
                <InfoIcon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" strokeWidth={1.5} />
              </div>
              <div className="w-8 h-8 rounded-xl bg-secondary/60 flex items-center justify-center shrink-0">
                <stat.icon
                  className={`w-4 h-4 ${stat.label === "Despesas em Aberto" ? "text-warning" : "text-accent"
                    }`}
                  strokeWidth={1.5}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div
                title={stat.tooltip}
                className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums"
              >
                {stat.value}
              </div>
              <div className="flex items-center justify-between gap-2 pt-0.5">
                <span className="text-xs text-muted-foreground truncate">{stat.subtext}</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Main Chart (Projeção Real vs Previsto vinda da API) */}
      <Card className="border-border bg-card rounded-2xl">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-semibold text-foreground">
                Projeção de Fluxo: Realizado vs Previsto
              </CardTitle>
              {forecast?.methodology && (
                <p className="text-xs text-muted-foreground mt-0.5 max-w-prose line-clamp-2" title={forecast.methodology}>
                  {forecast.methodology}
                </p>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-lg bg-chart-1" />
                <span className="text-muted-foreground">Realizado</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-lg bg-chart-4" />
                <span className="text-muted-foreground">Previsto</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-lg bg-muted-foreground/30" />
                <span className="text-muted-foreground">Teto</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            {!isReady || isLoading ? (
              <Skeleton className="h-full w-full rounded-xl" />
            ) : isError ? (
              <div className="h-full flex items-center justify-center text-xs text-destructive">
                Erro ao carregar projeção de despesas.
              </div>
            ) : projectionData.length === 0 ? (
              <div className="h-full flex items-center justify-center border border-dashed border-border rounded-xl text-xs text-muted-foreground">
                Sem dados no período
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={projectionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} fontFamily="var(--font-sans), sans-serif" />
                  <YAxis
                    stroke="var(--muted-foreground)"
                    fontSize={12}
                    fontFamily="var(--font-sans), sans-serif"
                    tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      fontFamily: "var(--font-sans), sans-serif",
                      fontSize: "12px",
                      color: "var(--popover-foreground)",
                    }}
                    formatter={(value: unknown) => [`R$ ${Number(value || 0).toLocaleString("pt-BR")}`, ""]}
                  />
                  <Area
                    type="linear"
                    dataKey="target"
                    stroke="var(--muted-foreground)"
                    strokeDasharray="5 5"
                    fill="none"
                    strokeWidth={1}
                    isAnimationActive={false}
                  />
                  <Area
                    type="linear"
                    dataKey="forecast"
                    stroke="var(--chart-4)"
                    fill="var(--chart-4)"
                    fillOpacity={0.12}
                    strokeWidth={1.5}
                    isAnimationActive={false}
                  />
                  <Area
                    type="linear"
                    dataKey="actual"
                    stroke="var(--chart-1)"
                    fill="var(--chart-1)"
                    fillOpacity={0.15}
                    strokeWidth={2}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quarterly Forecast Breakdown */}
        <Card className="border-border bg-card rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-foreground">
              Previsão Trimestral por Cenário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {!isReady || isLoading ? (
                <Skeleton className="h-full w-full rounded-xl" />
              ) : isError ? (
                <div className="h-full flex items-center justify-center text-xs text-destructive">
                  Erro ao carregar previsão trimestral.
                </div>
              ) : quarterlyData.length === 0 ? (
                <div className="h-full flex items-center justify-center border border-dashed border-border rounded-xl text-xs text-muted-foreground">
                  Sem dados no período
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={quarterlyData} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="quarter" stroke="var(--muted-foreground)" fontSize={12} fontFamily="var(--font-sans), sans-serif" />
                    <YAxis
                      stroke="var(--muted-foreground)"
                      fontSize={12}
                      fontFamily="var(--font-sans), sans-serif"
                      tickFormatter={(value) => `R$ ${(Number(value || 0) / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        fontFamily: "var(--font-sans), sans-serif",
                        fontSize: "12px",
                        color: "var(--popover-foreground)",
                      }}
                      formatter={(value: unknown) => [`R$ ${Number(value || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, ""]}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: "12px", fontFamily: "var(--font-sans), sans-serif" }}
                    />
                    <Bar dataKey="committed" name="Conservador" fill="var(--chart-3)" radius={[2, 2, 0, 0]} isAnimationActive={false} />
                    <Bar dataKey="bestCase" name="Previsto (Base)" fill="var(--chart-1)" radius={[2, 2, 0, 0]} isAnimationActive={false} />
                    <Bar dataKey="pipeline" name="Otimista" fill="var(--chart-2)" radius={[2, 2, 0, 0]} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Scenario Analysis */}
        <Card className="border-border bg-card rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">
              Análise de Cenários
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!isReady || isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-xl" />
                ))}
              </div>
            ) : isError ? (
              <div className="py-12 text-center text-xs text-destructive">
                Erro ao carregar cenários.
              </div>
            ) : scenariosData.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-border rounded-xl text-xs text-muted-foreground">
                Sem dados no período
              </div>
            ) : (
              scenariosData.map((scenario, idx) => {
                const val = Number(scenario.revenue ?? scenario.forecast ?? 0);
                const scenarioColor =
                  scenario.name.toLowerCase().includes("conservador")
                    ? "var(--chart-3)"
                    : scenario.name.toLowerCase().includes("otimista")
                      ? "var(--chart-2)"
                      : idx === 0
                        ? "var(--chart-3)"
                        : idx === 2
                          ? "var(--chart-2)"
                          : "var(--chart-1)";
                return (
                  <div
                    key={scenario.name}
                    className="p-3.5 rounded-xl bg-secondary/30 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-1.5 h-6 rounded-lg"
                          style={{ backgroundColor: scenarioColor }}
                        />
                        <div>
                          <p className="text-sm font-medium text-foreground">{scenario.name}</p>
                          <p className="text-xs font-medium text-muted-foreground">
                            {scenario.probability}% probabilidade
                          </p>
                        </div>
                      </div>
                      <p className="text-base sm:text-lg font-bold tabular-nums text-foreground">
                        R$ {val.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="w-full h-1.5 bg-secondary rounded-lg overflow-hidden">
                      <div
                        className="h-full rounded-lg transition-all duration-300"
                        style={{
                          width: `${scenario.probability}%`,
                          backgroundColor: scenarioColor,
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Risk Factors Section */}
      <Card className="border-border bg-card rounded-2xl">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">
                Fatores de Risco Orçamentário
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-prose">
                Riscos identificados por regras automáticas determinísticas e cadastros manuais
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-xs text-warning border-warning/30 rounded-lg">
                <AlertTriangleIcon className="w-3 h-3 mr-1" strokeWidth={1.5} />
                {riskFactorsList.length} identificados
              </Badge>
              <Button
                onClick={() => setIsAddRiskOpen(true)}
                className="min-h-11 sm:min-h-9 gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg text-xs"
              >
                <PlusIcon data-icon="inline-start" strokeWidth={1.5} /> Novo Fator de Risco
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {riskFactorsList.length === 0 ? (
            <div className="py-8 text-center text-xs font-medium text-muted-foreground max-w-prose mx-auto">
              Nenhum fator de risco identificado no momento. Todos os centros de custo e contratos estão em conformidade.
            </div>
          ) : (
            <div className="space-y-3">
              {riskFactorsList.map((risk) => (
                <div
                  key={risk.key}
                  className="p-3.5 rounded-xl bg-secondary/30 transition-colors group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedRiskDetails(risk);
                        }
                      }}
                      className="flex items-start gap-3 cursor-pointer flex-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-lg"
                      onClick={() => setSelectedRiskDetails(risk)}
                    >
                      <div
                        className={`w-2 h-2 rounded-lg mt-1.5 shrink-0 ${risk.severity === "high" ? "bg-destructive" : "bg-warning"
                          }`}
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors">
                            {risk.title}
                          </p>
                          <Badge
                            variant="outline"
                            className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${risk.origin === "AUTOMATIC"
                                ? "border-accent/40 bg-accent/10 text-accent"
                                : "border-border bg-secondary text-muted-foreground"
                              }`}
                          >
                            {risk.origin === "AUTOMATIC" ? "Regra Automática" : "Manual"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 max-w-prose">{risk.description}</p>
                      </div>
                    </div>

                    <Badge
                      className={`shrink-0 ml-2 rounded-lg text-xs font-bold tabular-nums ${risk.severity === "high"
                          ? "bg-destructive/20 text-destructive border-destructive/30"
                          : "bg-warning/20 text-warning border-warning/30"
                        }`}
                    >
                      -R$ {Number(risk.estimatedAmount || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </Badge>
                  </div>

                  {risk.relatedDeals && risk.relatedDeals.length > 0 && (
                    <div className="ml-5 flex items-center gap-2 flex-wrap mt-1">
                      {risk.relatedDeals.map((deal) => (
                        <Badge
                          key={deal}
                          variant="outline"
                          className="text-xs rounded-lg text-muted-foreground border-border bg-background/50"
                        >
                          {deal}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="ml-5 mt-3 flex items-center justify-between">
                    <Button
                      variant="ghost"
                      onClick={() => setSelectedRiskMitigation(risk)}
                      className="min-h-10 sm:min-h-8 text-xs text-accent hover:text-accent hover:bg-accent/10 px-2.5 rounded-lg gap-1"
                    >
                      <ShieldCheckIcon data-icon="inline-start" strokeWidth={1.5} />
                      Ver plano de mitigação
                      <ArrowRightIcon data-icon="inline-end" strokeWidth={1.5} />
                    </Button>
                    <span className="text-xs font-medium text-muted-foreground">
                      Prazo: {risk.deadline ? new Date(risk.deadline).toLocaleDateString("pt-BR") : "A Definir"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modais Integrados */}
      <ForecastBreakdownModal
        open={breakdownMetric !== null}
        onOpenChange={(open) => !open && setBreakdownMetric(null)}
        metricType={breakdownMetric}
        forecast={forecast}
        periodLabel={`${longLabel} / Trimestre ${timeframe}`}
        referenceYear={year}
      />

      <RiskDetailsModal
        open={selectedRiskDetails !== null}
        onOpenChange={(open) => !open && setSelectedRiskDetails(null)}
        risk={selectedRiskDetails}
        onOpenMitigation={(risk) => setSelectedRiskMitigation(risk)}
        onNavigateSection={onNavigate}
      />

      <MitigationPlanModal
        open={selectedRiskMitigation !== null}
        onOpenChange={(open) => !open && setSelectedRiskMitigation(null)}
        risk={selectedRiskMitigation}
      />

      <RiskFactorModal
        open={isAddRiskOpen}
        onOpenChange={setIsAddRiskOpen}
      />
    </div>
  );
}
