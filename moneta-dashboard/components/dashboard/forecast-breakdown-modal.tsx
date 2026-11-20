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
import type { ForecastResponse } from "@/types/api";

interface ForecastBreakdownModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metricType: "forecastT2" | "accuracy" | "coverage" | "openExpenses" | null;
  forecast?: ForecastResponse | null;
  periodLabel?: string;
  referenceYear?: number;
}

export function ForecastBreakdownModal({
  open,
  onOpenChange,
  metricType,
  forecast,
  periodLabel,
  referenceYear,
}: ForecastBreakdownModalProps) {
  if (!metricType) return null;

  const kpis = forecast?.kpis;

  const metricInfo: Record<
    string,
    { title: string; subtitle: string; formula: string; explanation: string }
  > = {
    forecastT2: {
      title: "Detalhamento: Previsão Trimestre T2",
      subtitle: `R$ ${(kpis?.forecastT2 ?? 0).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
      })} projetado para os próximos 3 meses (Teto T2: R$ ${(kpis?.forecastT2Ceiling ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })})`,
      formula:
        kpis?.formulas?.forecastT2 ||
        "Previsão T2 = gasto mensal consolidado dos lançamentos reais x 3 meses (Teto T2 = soma dos tetos das categorias x 3).",
      explanation:
        "Calculado de forma determinística multiplicando a despesa mensal corrente por 3 meses, comparada ao teto trimestral consolidado de todos os centros de custo cadastrados.",
    },
    accuracy: {
      title: "Detalhamento: Acurácia Histórica",
      subtitle: `${kpis?.accuracyPct ?? 0}% de aderência média às previsões e tetos`,
      formula:
        kpis?.formulas?.accuracy ||
        "Acurácia Histórica = 100 - (|teto_total - gasto_real| / teto_total * 50)% de aderência média.",
      explanation:
        "Mede a proximidade entre os gastos reais das categorias e os limites orçamentários estabelecidos, sem desvios abruptos.",
    },
    coverage: {
      title: "Detalhamento: Cobertura de Saldo",
      subtitle:
        kpis?.balanceCoverage !== null && kpis?.balanceCoverage !== undefined
          ? `${kpis.balanceCoverage.toLocaleString("pt-BR", {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })} meses de autonomia financeira`
          : "— (Sem despesas no período para calcular)",
      formula:
        kpis?.formulas?.coverage ||
        "Cobertura de Saldo = saldo acumulado total das contas ativas / despesas mensais.",
      explanation:
        "Indica quantos meses a empresa consegue honrar suas despesas operacionais utilizando exclusivamente o saldo líquido disponível nas contas bancárias ativas.",
    },
    openExpenses: {
      title: "Detalhamento: Despesas em Aberto",
      subtitle: `R$ ${(kpis?.openExpensesAmount ?? 0).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
      })} pendentes (${kpis?.openExpensesCount ?? 0} faturas)`,
      formula:
        kpis?.formulas?.openExpenses ||
        "Despesas em Aberto = ∑(despesas com status PENDING ou data futura no período).",
      explanation:
        "Soma de compromissos operacionais, boletos e contratos cadastrados que ainda aguardam conciliação bancária ou liquidação no mês corrente.",
    },
  };

  const current = metricInfo[metricType];
  const quarterly = forecast?.quarterlyForecast || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-card border-input rounded-2xl shadow-xl text-foreground max-h-[85vh] flex flex-col p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg font-semibold text-foreground tracking-tight">
            {current.title}
          </DialogTitle>
          <p className="text-xs font-medium text-muted-foreground">{current.subtitle}</p>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto pr-1">
          {/* Fórmula Matemática Determinística */}
          <div className="rounded-lg bg-secondary/30 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Fórmula Determinística
              </span>
              <Badge variant="outline" className="text-xs rounded-lg text-accent border-accent/30">
                100% Regra de Negócio
              </Badge>
            </div>
            <p className="text-xs text-foreground bg-background/80 p-2.5 rounded-lg">
              {current.formula}
            </p>
            <p className="text-xs text-muted-foreground">{current.explanation}</p>
          </div>

          {/* Dados Usados no Cálculo */}
          <div>
            <h3 className="text-xs font-medium text-muted-foreground mb-2">
              Projeções Trimestrais Relacionadas
            </h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-xs font-medium text-muted-foreground">
                      Trimestre
                    </TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground text-right">
                      Pessimista
                    </TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground text-right">
                      Previsto (Base)
                    </TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground text-right">
                      Otimista
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quarterly.map((q) => (
                    <TableRow key={q.quarter} className="border-border">
                      <TableCell className="py-2 text-xs font-medium text-foreground">
                        {q.quarter} {referenceYear ?? ""}
                      </TableCell>
                      <TableCell className="py-2 text-xs tabular-nums text-right text-muted-foreground">
                        R$ {Number(q.committed ?? q.pessimistic ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="py-2 text-xs tabular-nums text-right font-semibold text-foreground">
                        R$ {Number(q.bestCase ?? q.realistic ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="py-2 text-xs tabular-nums text-right text-accent">
                        R$ {Number(q.pipeline ?? q.optimistic ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Transparência & Período */}
          <div className="rounded-lg bg-secondary/20 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs font-medium text-muted-foreground">
            <span>Período Ativo: {periodLabel || "Período de Referência"}</span>
            <span>Fonte de dados: PostgreSQL (Lançamentos e Centros Reais)</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
