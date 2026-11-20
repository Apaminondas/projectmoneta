"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ReportDashboard } from "@/types/api";

interface ReportSummaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "monthlySummary" | "savingsRate" | "incomeSources" | "forecastCeiling" | null;
  dashboardData?: ReportDashboard | null;
  periodLabel?: string;
}

export function ReportSummaryModal({
  open,
  onOpenChange,
  type,
  dashboardData,
  periodLabel,
}: ReportSummaryModalProps) {
  if (!type) return null;

  const modalMeta: Record<
    string,
    { title: string; subtitle: string; description: string }
  > = {
    monthlySummary: {
      title: "Demonstrativo: Resumo Mensal Consolidado",
      subtitle: "Métricas consolidadas de receitas, despesas e resultado líquido operacional",
      description:
        "Consolidação analítica do mês corrente com base nos lançamentos contábeis registrados na base de dados.",
    },
    savingsRate: {
      title: "Demonstrativo: Taxa de Poupança & Margem",
      subtitle: "Índice de retenção de capital sobre o faturamento bruto",
      description:
        "Calculado como (Receitas - Despesas) / Receitas. Representa a capacidade de reinvestimento e geração de caixa líquido da empresa.",
    },
    incomeSources: {
      title: "Demonstrativo: Origem das Receitas",
      subtitle: "Detalhamento e ponderação das fontes de faturamento e crédito",
      description:
        "Distribuição percentual e absoluta de todas as entradas financeiras agrupadas por contratos, serviços e rendimentos.",
    },
    forecastCeiling: {
      title: "Demonstrativo: Previsão & Aderência ao Teto",
      subtitle: "Execução orçamentária versus limites teto definidos por centro de custo",
      description:
        "Comparativo entre os valores gastos reais e os tetos estipulados para cada departamento, garantindo compliance orçamentário.",
    },
  };

  const meta = modalMeta[type] || modalMeta.monthlySummary;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-card border-input rounded-2xl shadow-xl text-foreground p-4 sm:p-6">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="border-accent text-accent text-xs rounded-lg">
              Auditoria Financeira
            </Badge>
            <span className="text-xs text-muted-foreground">
              Competência: {periodLabel || "Atual"}
            </span>
          </div>
          <DialogTitle className="text-base sm:text-lg font-semibold tracking-tight">{meta.title}</DialogTitle>
          <p className="text-xs text-muted-foreground">{meta.subtitle}</p>
        </DialogHeader>

        <div className="space-y-4 my-2 text-sm">
          <div className="p-3 bg-secondary/30 rounded-lg text-xs text-muted-foreground">
            {meta.description}
          </div>

          {/* Conditional content based on card type */}
          {type === "monthlySummary" && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-secondary/20 rounded-2xl border border-border">
                  <p className="text-xs font-medium text-muted-foreground">Receita Bruta</p>
                  <p className="text-base font-semibold tabular-nums text-success mt-1">
                    R${" "}
                    {(dashboardData?.monthlyIncome ?? 0).toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div className="p-3 bg-secondary/20 rounded-2xl border border-border">
                  <p className="text-xs font-medium text-muted-foreground">Despesas Totais</p>
                  <p className="text-base font-semibold tabular-nums text-destructive mt-1">
                    R${" "}
                    {(dashboardData?.monthlyExpense ?? 0).toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div className="p-3 bg-secondary/20 rounded-2xl border border-border">
                  <p className="text-xs font-medium text-muted-foreground">Resultado Líquido</p>
                  <p className="text-base font-semibold tabular-nums text-accent mt-1">
                    R${" "}
                    {(dashboardData?.monthlyBalance ?? 0).toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-xs font-medium text-muted-foreground">Indicador</TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground text-right">Valor</TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="border-border">
                      <TableCell className="text-xs font-medium">Margem Operacional</TableCell>
                      <TableCell className="text-xs text-right tabular-nums">
                        {(dashboardData?.savingsRate ?? 0).toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-xs text-right">
                        <Badge variant="outline" className="text-success border-success/30 text-xs rounded-lg">
                          Positiva
                        </Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow className="border-border">
                      <TableCell className="text-xs font-medium">Índice de Liquidez</TableCell>
                      <TableCell className="text-xs text-right tabular-nums">
                        {dashboardData?.monthlyExpense && dashboardData.monthlyExpense > 0
                          ? ((dashboardData.monthlyIncome || 0) / dashboardData.monthlyExpense).toFixed(2)
                          : "1.00"}
                        x
                      </TableCell>
                      <TableCell className="text-xs text-right">
                        <Badge variant="outline" className="text-accent border-accent/30 text-xs rounded-lg">
                          Saudável
                        </Badge>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {type === "savingsRate" && (
            <div className="space-y-3">
              <div className="p-3 bg-secondary/20 rounded-2xl border border-border flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Taxa de Poupança Vigente</p>
                  <p className="text-xl sm:text-2xl font-bold tabular-nums text-accent mt-1">
                    {(dashboardData?.savingsRate ?? 0).toFixed(1)}%
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="text-success border-success/40 text-xs rounded-lg">
                    Meta Corporativa: 20%+
                  </Badge>
                  <p className="text-xs font-medium text-muted-foreground mt-1">Superavit operacional</p>
                </div>
              </div>

              <p className="text-xs font-semibold text-foreground">Histórico Mensal de Retenção:</p>
              <div className="rounded-lg border border-border overflow-hidden max-h-[220px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-xs font-medium text-muted-foreground">Mês</TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground text-right">Taxa Poupança</TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground text-right">Meta Atingida</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(dashboardData?.savingsRateEvolution ?? []).map((item) => (
                      <TableRow key={item.month} className="border-border">
                        <TableCell className="text-xs font-medium">{item.month}</TableCell>
                        <TableCell className="text-xs text-right font-semibold tabular-nums">
                          {item.rate !== null && item.rate !== undefined
                            ? `${item.rate.toLocaleString("pt-BR", {
                                minimumFractionDigits: 1,
                                maximumFractionDigits: 1,
                              })}%`
                            : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          {item.rate === null || item.rate === undefined ? (
                            <span className="text-muted-foreground">—</span>
                          ) : item.rate >= 20 ? (
                            <Badge variant="outline" className="text-success border-success/30 text-xs rounded-lg">
                              Atingida
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-warning border-warning/30 text-xs rounded-lg">
                              Abaixo
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {type === "incomeSources" && (
            <div className="space-y-3">
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-xs font-medium text-muted-foreground">Fonte / Contrato</TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground text-right">Valor Consolidado</TableHead>
                      <TableHead className="text-xs font-medium text-muted-foreground text-right">Participação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(dashboardData?.revenueSources ?? []).map((src, idx) => {
                      const colors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
                      const bulletColor = colors[idx % colors.length];
                      return (
                        <TableRow key={src.name} className="border-border">
                          <TableCell className="text-xs font-medium flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-lg"
                              style={{ backgroundColor: bulletColor }}
                            />
                            {src.name}
                          </TableCell>
                        <TableCell className="text-xs text-right font-semibold tabular-nums">
                          R${" "}
                          {(src.amount ?? 0).toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell className="text-xs text-right tabular-nums">
                          <span className="font-medium text-foreground">{src.percentage}%</span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {type === "forecastCeiling" && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-secondary/20 rounded-2xl border border-border">
                  <p className="text-xs font-medium text-muted-foreground">Despesas Realizadas</p>
                  <p className="text-base font-semibold tabular-nums text-foreground mt-1">
                    R${" "}
                    {(dashboardData?.totalSpent ?? 0).toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div className="p-3 bg-secondary/20 rounded-2xl border border-border">
                  <p className="text-xs font-medium text-muted-foreground">Teto Orçamentário</p>
                  <p className="text-base font-semibold tabular-nums text-accent mt-1">
                    R${" "}
                    {(dashboardData?.totalCeiling ?? 0).toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-secondary/15 rounded-lg text-xs">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-muted-foreground">Consumo do Teto Consolidado:</span>
                  <span className="font-semibold tabular-nums text-foreground">
                    {dashboardData?.totalCeiling && dashboardData.totalCeiling > 0
                      ? (((dashboardData.totalSpent || 0) / dashboardData.totalCeiling) * 100).toFixed(1)
                      : "0.0"}
                    %
                  </span>
                </div>
                <div className="w-full h-1.5 bg-secondary rounded-lg overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-lg"
                    style={{
                      width: `${Math.min(
                        100,
                        dashboardData?.totalCeiling && dashboardData.totalCeiling > 0
                          ? ((dashboardData.totalSpent || 0) / dashboardData.totalCeiling) * 100
                          : 0
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
