"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  FileTextIcon,
  DownloadIcon,
  CalendarIcon,
  TrendingUpIcon,
  PieChartIcon,
  BarChart2Icon,
  ClockIcon,
  ChevronRightIcon,
  Loader2Icon,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  useReportsDashboard,
  useGeneratedReports,
} from "@/hooks/use-moneta-api";
import { useReferencePeriod } from "@/hooks/use-reference-period";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiClient } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import { ReportSummaryModal } from "@/components/dashboard/report-summary-modal";
import { GenerateReportModal } from "@/components/dashboard/generate-report-modal";
import { DataTablePagination } from "@/components/dashboard/data-table-pagination";

function ReportCard({
  title,
  description,
  icon: Icon,
  color,
  onClick,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  index?: number;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left group bg-card border border-border rounded-2xl shadow-xs p-4 sm:p-5 hover:border-accent/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors flex flex-col justify-between"
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors">{title}</h3>
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", color)}>
            <Icon className="w-4 h-4" strokeWidth={1.5} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-3">{description}</p>
      </div>
      <span className="flex items-center gap-1 text-xs text-accent font-medium group-hover:gap-2 transition-all duration-200">
        Ver Relatório
        <ChevronRightIcon data-icon="inline-end" className="w-3 h-3" strokeWidth={1.5} />
      </span>
    </button>
  );
}

export function ReportsSection() {
  const [chartsLoaded, setChartsLoaded] = useState(false);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [selectedSummaryType, setSelectedSummaryType] = useState<
    "monthlySummary" | "savingsRate" | "incomeSources" | "forecastCeiling" | null
  >(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const { year, month, shortLabel, isReady } = useReferencePeriod();
  const {
    data: dashboardData,
    isLoading: isLoadingDashboard,
    isError: isErrorDashboard,
  } = useReportsDashboard({ year, month }, isReady);
  const {
    data: serverReports,
    isLoading: isLoadingReports,
    isError: isErrorReports,
  } = useGeneratedReports();

  useEffect(() => {
    const timer = setTimeout(() => setChartsLoaded(true), 400);
    return () => clearTimeout(timer);
  }, []);

  const openSummary = (
    type: "monthlySummary" | "savingsRate" | "incomeSources" | "forecastCeiling"
  ) => {
    setSelectedSummaryType(type);
    setSummaryModalOpen(true);
  };

  const handleDownload = async (id: number) => {
    setDownloadingId(id);
    try {
      const { blob, filename } = await apiClient.reports.downloadReport(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      // Falha tratada silenciosamente sem expor detalhes internos no console
    } finally {
      setDownloadingId(null);
    }
  };

  const conversionData = dashboardData?.savingsRateEvolution ?? [];
  const hasConversionData = conversionData.some(
    (item) => item.rate !== null && item.rate !== undefined
  );

  const THEME_CHART_COLORS = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
  ];
  const sourceData = (dashboardData?.revenueSources ?? []).map((s, idx) => ({
    name: s.name,
    value: s.percentage,
    color: THEME_CHART_COLORS[idx % THEME_CHART_COLORS.length],
  }));

  const displayReports = (serverReports ?? []).map((r) => ({
    id: r.id,
    name: r.title,
    type: r.reportType || "Extrato",
    date: r.createdAt
      ? new Date(r.createdAt).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "N/D",
    status: r.status?.toLowerCase() === "generating" ? "generating" : "ready",
    formattedSize: r.formattedSize,
  }));

  // Pagination for reports
  const [reportsPage, setReportsPage] = useState(1);
  const reportsPageSize = 4;
  const totalReportsPages = Math.max(1, Math.ceil(displayReports.length / reportsPageSize));
  const paginatedReports = displayReports.slice(
    (reportsPage - 1) * reportsPageSize,
    reportsPage * reportsPageSize
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-foreground">Relatórios Contábeis</h2>
          <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">
            Emissão de demonstrativos em PDF e auditoria de fluxo de caixa corporativo • Referência: {shortLabel}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setGenerateModalOpen(true)}
          className="min-h-11 sm:min-h-9 px-3.5 rounded-lg bg-accent text-accent-foreground text-xs font-semibold hover:bg-accent/90 transition-colors duration-150 inline-flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <FileTextIcon data-icon="inline-start" className="w-4 h-4 shrink-0" strokeWidth={1.5} />
          <span>Gerar Relatório</span>
        </button>
      </div>
      {/* Quick report cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ReportCard
          title="Resumo Mensal"
          description={
            dashboardData
              ? `Receita R$ ${(dashboardData.monthlyIncome || 0).toLocaleString("pt-BR", { maximumFractionDigits: 0 })} • Saldo R$ ${(dashboardData.monthlyBalance || 0).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`
              : "Métricas consolidadas de receitas e despesas"
          }
          icon={BarChart2Icon}
          color="bg-chart-1/10 text-chart-1"
          index={0}
          onClick={() => openSummary("monthlySummary")}
        />
        <ReportCard
          title="Taxa de Poupança"
          description={
            dashboardData
              ? `${(dashboardData.savingsRate || 0).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}% do faturamento retido no caixa`
              : "Análise do índice de economia pessoal"
          }
          icon={TrendingUpIcon}
          color="bg-accent/10 text-accent"
          index={1}
          onClick={() => openSummary("savingsRate")}
        />
        <ReportCard
          title="Fontes de Renda"
          description={
            dashboardData && dashboardData.revenueSources.length > 0
              ? `${dashboardData.revenueSources.length} fontes corporativas ativas`
              : "Detalhamento das origens de crédito"
          }
          icon={PieChartIcon}
          color="bg-warning/10 text-warning border-warning/30"
          index={2}
          onClick={() => openSummary("incomeSources")}
        />
        <ReportCard
          title="Previsão & Teto"
          description={
            dashboardData
              ? `Gasto R$ ${(dashboardData.totalSpent || 0).toLocaleString("pt-BR", { maximumFractionDigits: 0 })} de R$ ${(dashboardData.totalCeiling || 0).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`
              : "Projeções e limites orçamentários"
          }
          icon={CalendarIcon}
          color="bg-accent/10 text-accent border border-accent/20"
          index={3}
          onClick={() => openSummary("forecastCeiling")}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolução da taxa de poupança */}
        <div className="bg-card border border-border rounded-2xl shadow-xs p-4 sm:p-5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-foreground">Evolução da Taxa de Poupança</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Percentual poupado mensalmente sobre as receitas</p>
            </div>
            {(() => {
              const validRates = (dashboardData?.savingsRateEvolution ?? []).filter(
                (item): item is { month: string; rate: number } =>
                  item.rate !== null && item.rate !== undefined
              );
              if (validRates.length < 2 || validRates[0].rate === 0) {
                return (
                  <div className="text-xs text-muted-foreground font-medium tabular-nums">
                    N/D
                  </div>
                );
              }
              const first = validRates[0].rate;
              const last = validRates[validRates.length - 1].rate;
              const diff = ((last - first) / Math.abs(first)) * 100;
              const isPos = diff >= 0;
              return (
                <div
                  className={cn(
                    "flex items-center gap-1.5 text-xs font-medium tabular-nums",
                    isPos ? "text-success" : "text-destructive"
                  )}
                >
                  {isPos ? (
                    <TrendingUpIcon className="w-3.5 h-3.5" strokeWidth={1.5} />
                  ) : (
                    <TrendingUpIcon className="w-3.5 h-3.5 rotate-180" strokeWidth={1.5} />
                  )}
                  {isPos ? "+" : ""}
                  {diff.toLocaleString("pt-BR", {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  })}
                  % no período
                </div>
              );
            })()}
          </div>
          <div className="h-[250px]">
            {!isReady || isLoadingDashboard || !chartsLoaded ? (
              <div className="h-full w-full flex flex-col justify-end gap-3 p-2">
                <Skeleton className="h-44 w-full rounded-xl" />
                <Skeleton className="h-4 w-full rounded-lg" />
              </div>
            ) : isErrorDashboard ? (
              <div className="h-full w-full flex items-center justify-center text-xs text-destructive">
                Erro ao carregar evolução da taxa de poupança.
              </div>
            ) : !hasConversionData ? (
              <div className="h-full w-full flex items-center justify-center border border-dashed border-border rounded-xl text-xs text-muted-foreground">
                Sem dados no período
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={conversionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 12, fontFamily: "var(--font-sans), sans-serif" }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 12, fontFamily: "var(--font-sans), sans-serif" }}
                    tickFormatter={(value) => `${value}%`}
                    dx={-10}
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
                    labelStyle={{ color: "var(--popover-foreground)", fontWeight: 600 }}
                    formatter={(value: unknown) => [
                      value === null || value === undefined
                        ? "N/D"
                        : `${Number(value).toFixed(1)}%`,
                      "Taxa de Poupança",
                    ]}
                  />
                  <Line
                    type="linear"
                    dataKey="rate"
                    connectNulls
                    stroke="var(--accent)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 2 }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Lead sources pie chart */}
        <div className="bg-card border border-border rounded-2xl shadow-xs p-4 sm:p-5">
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-foreground">Origem das Receitas</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Distribuição das fontes de crédito no mês</p>
          </div>
          {!isReady || isLoadingDashboard || !chartsLoaded ? (
            <div className="h-[180px] flex items-center gap-6">
              <Skeleton className="w-[160px] h-[160px] rounded-full shrink-0" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-4 w-full rounded-lg" />
                <Skeleton className="h-4 w-4/5 rounded-lg" />
                <Skeleton className="h-4 w-3/5 rounded-lg" />
              </div>
            </div>
          ) : isErrorDashboard ? (
            <div className="h-[180px] flex items-center justify-center text-xs text-destructive">
              Erro ao carregar origem das receitas.
            </div>
          ) : sourceData.length === 0 ? (
            <div className="h-[180px] flex items-center justify-center border border-dashed border-border rounded-xl text-xs text-muted-foreground">
              Sem dados no período
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-[180px] h-[180px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sourceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      stroke="var(--card)"
                      strokeWidth={2}
                      dataKey="value"
                      isAnimationActive={false}
                    >
                      {sourceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 w-full space-y-2.5">
                {sourceData.map((source) => (
                  <div
                    key={source.name}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-lg" style={{ backgroundColor: source.color }} />
                      <span className="text-xs text-foreground">{source.name}</span>
                    </div>
                    <span className="text-xs font-bold tabular-nums text-foreground">{source.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent reports table */}
      <div className="bg-card border border-border rounded-2xl shadow-xs overflow-hidden">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Relatórios Recentes</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Documentos e demonstrativos contábeis gerados</p>
          </div>
          <button
            type="button"
            onClick={() => setGenerateModalOpen(true)}
            className="min-h-11 sm:min-h-9 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors"
          >
            <FileTextIcon data-icon="inline-start" className="w-3.5 h-3.5" strokeWidth={1.5} />
            Gerar Novo
          </button>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-xs font-medium text-muted-foreground">Documento</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Tipo</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Data</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingReports ? (
                <TableRow className="border-border">
                  <TableCell colSpan={4} className="py-8">
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-full rounded-lg" />
                      <Skeleton className="h-8 w-full rounded-lg" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : isErrorReports ? (
                <TableRow className="border-border">
                  <TableCell colSpan={4} className="py-8 text-center text-xs text-destructive">
                    Erro ao carregar histórico de relatórios.
                  </TableCell>
                </TableRow>
              ) : paginatedReports.length === 0 ? (
                <TableRow className="border-border">
                  <TableCell colSpan={4} className="py-8 text-center text-xs text-muted-foreground">
                    Sem dados no período
                  </TableCell>
                </TableRow>
              ) : (
                paginatedReports.map((report) => (
                  <TableRow key={report.id} className="border-border hover:bg-secondary/30 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                        <FileTextIcon className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{report.name}</p>
                        {report.formattedSize && (
                          <span className="text-xs font-medium text-muted-foreground">{report.formattedSize}</span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-secondary border border-border text-foreground">
                      {report.type}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs font-medium text-muted-foreground">
                    {report.date}
                  </TableCell>
                  <TableCell className="text-right">
                    {report.status === "generating" ? (
                      <div className="inline-flex items-center gap-2 text-xs text-warning">
                        <ClockIcon className="w-3.5 h-3.5" strokeWidth={1.5} />
                        Gerando...
                      </div>
                    ) : (
                      <button
                        type="button"
                        aria-label={`Baixar relatório ${report.name}`}
                        onClick={() => handleDownload(report.id)}
                        disabled={downloadingId === report.id}
                        className="min-h-11 sm:min-h-8 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors"
                      >
                        {downloadingId === report.id ? (
                          <Loader2Icon data-icon="inline-start" className="w-3.5 h-3.5 animate-spin text-accent" strokeWidth={1.5} />
                        ) : (
                          <DownloadIcon data-icon="inline-start" className="w-3.5 h-3.5" strokeWidth={1.5} />
                        )}
                        {downloadingId === report.id ? "Baixando..." : "Baixar"}
                      </button>
                    )}
                  </TableCell>
                </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {totalReportsPages > 1 && (
          <DataTablePagination
            currentPage={reportsPage}
            totalPages={totalReportsPages}
            totalItems={displayReports.length}
            pageSize={reportsPageSize}
            onPageChange={setReportsPage}
            itemName="documentos"
          />
        )}
      </div>

      {/* Modals */}
      <ReportSummaryModal
        open={summaryModalOpen}
        onOpenChange={setSummaryModalOpen}
        type={selectedSummaryType}
        dashboardData={dashboardData}
        periodLabel={shortLabel}
      />

      <GenerateReportModal
        open={generateModalOpen}
        onOpenChange={setGenerateModalOpen}
      />
    </div>
  );
}
