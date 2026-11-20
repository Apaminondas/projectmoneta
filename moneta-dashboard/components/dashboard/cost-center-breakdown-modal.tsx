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
import type { BudgetResponse, CostCenter } from "@/types/api";

interface CostCenterBreakdownModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metricType: "spend" | "transactions" | "adherence" | null;
  budget?: BudgetResponse | null;
}

export function CostCenterBreakdownModal({
  open,
  onOpenChange,
  metricType,
  budget,
}: CostCenterBreakdownModalProps) {
  if (!metricType) return null;

  const metricTitles: Record<string, { title: string; subtitle: string; formula: string }> = {
    spend: {
      title: "Detalhamento: Gasto Consolidado",
      subtitle: `R$ ${(budget?.consolidatedSpend ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} total consolidado no período`,
      formula: "Gasto Consolidado = ∑(despesas de todas as categorias/centros de custo no período).",
    },
    transactions: {
      title: "Detalhamento: Total de Lançamentos",
      subtitle: `${budget?.transactionCount ?? 0} lançamentos de despesa computados`,
      formula: "Total de Lançamentos = ∑(contagem de despesas registradas no período).",
    },
    adherence: {
      title: "Detalhamento: Aderência Média ao Teto",
      subtitle: `${budget?.avgCeilingAdherence ?? 0}% média de utilização dos tetos orçamentários`,
      formula: "Aderência Média = média(gasto_real / teto_mensal * 100) para centros com teto > 0.",
    },
  };

  const current = metricTitles[metricType];
  const costCenters: CostCenter[] = budget?.costCenters || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-card border-input rounded-2xl shadow-xl text-foreground max-h-[85vh] flex flex-col p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-foreground tracking-tight">
            {current?.title}
          </DialogTitle>
          <p className="text-xs font-medium text-muted-foreground">{current?.subtitle}</p>
        </DialogHeader>

        {/* Banner de Metodologia e Fórmula */}
        <div className="p-3 rounded-lg bg-secondary/30 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold text-foreground">Fórmula e Metodologia:</p>
          <p className="text-xs">{current?.formula}</p>
        </div>

        {/* Tabela de Centros de Custo */}
        <div className="flex-1 overflow-y-auto mt-2">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-xs font-medium text-muted-foreground">Centro de Custo</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Tipo</TableHead>
                <TableHead className="text-right text-xs font-medium text-muted-foreground">Gasto Real</TableHead>
                <TableHead className="text-right text-xs font-medium text-muted-foreground">Teto Mensal</TableHead>
                <TableHead className="text-right text-xs font-medium text-muted-foreground">Uso (%)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {costCenters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-xs font-medium text-muted-foreground">
                    Nenhum centro de custo encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                costCenters.map((cc) => (
                  <TableRow key={cc.categoryId} className="border-border hover:bg-secondary/20">
                    <TableCell className="font-medium text-foreground text-xs sm:text-sm">
                      {cc.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs font-medium rounded-lg border-border">
                        {cc.kind || "Geral"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-foreground font-semibold tabular-nums text-xs sm:text-sm">
                      R$ {cc.spent.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground tabular-nums text-xs sm:text-sm">
                      R$ {cc.ceiling.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-xs sm:text-sm">
                      <span
                        className={
                          cc.usagePct >= 100
                            ? "text-destructive font-bold"
                            : cc.usagePct >= 80
                            ? "text-warning font-semibold"
                            : "text-accent font-medium"
                        }
                      >
                        {cc.usagePct}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
