"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  EditIcon,
} from "lucide-react";
import { useTransactions } from "@/hooks/use-moneta-api";
import type { CostCenter } from "@/types/api";

interface CostCenterDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  costCenter: CostCenter | null;
  onEdit: (costCenter: CostCenter) => void;
}

export function CostCenterDetailsModal({
  open,
  onOpenChange,
  costCenter,
  onEdit,
}: CostCenterDetailsModalProps) {
  const { data: transactions = [], isLoading: isLoadingTransactions } = useTransactions(
    { categoryId: costCenter?.categoryId },
    Boolean(costCenter)
  );

  if (!costCenter) return null;

  const isOverCeiling = costCenter.usagePct >= 100;
  const isWarning = costCenter.usagePct >= 80 && costCenter.usagePct < 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-card border-input rounded-2xl shadow-xl text-foreground max-h-[88vh] flex flex-col p-4 sm:p-6">
        <DialogHeader className="flex flex-row items-center justify-between pb-4 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-lg bg-${costCenter.colorToken}`} />
              <DialogTitle className="text-lg font-semibold text-foreground tracking-tight">
                {costCenter.name}
              </DialogTitle>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs font-medium rounded-lg border-border">
                {costCenter.kind || "Geral"}
              </Badge>
              <span className="text-xs font-medium text-muted-foreground">
                Teto Mensal: R$ {costCenter.ceiling.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            className="min-h-11 sm:min-h-8 rounded-lg text-xs"
            onClick={() => {
              onOpenChange(false);
              onEdit(costCenter);
            }}
          >
            <EditIcon data-icon="inline-start" strokeWidth={1.5} />
            Editar Perfil
          </Button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pt-4">
          {/* Banner de Alerta do Teto */}
          {isOverCeiling ? (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive flex items-center gap-3">
              <AlertCircleIcon className="w-5 h-5 text-destructive shrink-0" strokeWidth={1.5} />
              <div>
                <p className="text-xs font-semibold text-destructive">
                  Alerta Crítico: Teto Orçamentário Estourado ({costCenter.usagePct}%)
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Os gastos reais superaram o limite estipulado em R${" "}
                  {(costCenter.spent - costCenter.ceiling).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}.
                </p>
              </div>
            </div>
          ) : isWarning ? (
            <div className="p-3 rounded-lg bg-warning/10 text-warning flex items-center gap-3">
              <AlertTriangleIcon className="w-5 h-5 text-warning shrink-0" strokeWidth={1.5} />
              <div>
                <p className="text-xs font-semibold text-warning">
                  Alerta de Atenção: Próximo ao Teto ({costCenter.usagePct}%)
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  O centro de custo ultrapassou a marca de 80% do limite orçamentário.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-accent/10 text-accent flex items-center gap-3">
              <CheckCircle2Icon className="w-5 h-5 text-accent shrink-0" strokeWidth={1.5} />
              <div>
                <p className="text-xs font-semibold text-accent">
                  Operação Regular ({costCenter.usagePct}% utilizado)
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Saldo orçamentário disponível: R${" "}
                  {(costCenter.ceiling - costCenter.spent).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}.
                </p>
              </div>
            </div>
          )}

          {/* Cards de Métricas */}
          <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-secondary/30 text-center text-xs">
            <div className="space-y-0.5">
              <span className="text-muted-foreground block text-[11px]">Gasto Real</span>
              <span className="font-bold text-foreground text-sm tabular-nums">
                R$ {costCenter.spent.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="space-y-0.5 border-x border-border/50">
              <span className="text-muted-foreground block text-[11px]">Teto Mensal</span>
              <span className="font-bold text-muted-foreground text-sm tabular-nums">
                R$ {costCenter.ceiling.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="space-y-0.5">
              <span className="text-muted-foreground block text-[11px]">Lançamentos</span>
              <span className="font-bold text-chart-1 text-sm tabular-nums">
                {costCenter.count} registros
              </span>
            </div>
          </div>

          {/* Liderança / Responsável do Centro */}
          <div className="pt-3 border-t border-border/60">
            <h3 className="text-xs font-semibold text-foreground mb-1">
              Liderança / Responsável do Centro
            </h3>
            <p className="text-sm font-medium text-foreground">
              {costCenter.contact?.name || "Responsável não atribuído"}
            </p>
          </div>

          {/* Lançamentos Recentes no Centro de Custo */}
          <div className="pt-2">
            <h3 className="text-xs font-semibold text-foreground mb-2">
              Lançamentos Vinculados no Período
            </h3>
            {isLoadingTransactions ? (
              <p className="text-xs font-medium text-muted-foreground py-4 text-center">
                Carregando lançamentos...
              </p>
            ) : transactions.length === 0 ? (
              <p className="text-xs font-medium text-muted-foreground py-4 text-center border border-dashed border-border rounded-lg">
                Nenhum lançamento registrado nesta categoria.
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-2.5 bg-secondary/20 rounded-lg flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-medium text-foreground">{tx.description}</p>
                      <p className="text-muted-foreground text-xs">{tx.date}</p>
                    </div>
                    <span className="font-semibold text-foreground tabular-nums">
                      R$ {tx.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
