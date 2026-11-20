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
import type { AccountSummary, Account } from "@/types/api";

interface AccountBreakdownModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metricType: "total" | "balance" | "regularity" | "transactions" | null;
  summary?: AccountSummary | null;
  accounts?: Account[];
}

export function AccountBreakdownModal({
  open,
  onOpenChange,
  metricType,
  summary,
  accounts = [],
}: AccountBreakdownModalProps) {
  if (!metricType) return null;

  const metricTitles: Record<string, { title: string; subtitle: string; formula: string }> = {
    total: {
      title: "Detalhamento: Total de Contas",
      subtitle: `${summary?.totalAccounts ?? accounts.length} contas ativas cadastradas no sistema`,
      formula: "Total de Contas = contagem de registros em 'accounts' com 'archived_at IS NULL'.",
    },
    balance: {
      title: "Detalhamento: Saldo Acumulado",
      subtitle: `R$ ${(summary?.accumulatedBalance ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} consolidado`,
      formula: "Saldo Acumulado = ∑(saldo_inicial + receitas_vinculadas - despesas_vinculadas).",
    },
    regularity: {
      title: "Detalhamento: Índice de Regularidade",
      subtitle: `${summary?.regularityIndex ?? 0}% média de pontualidade e movimentação`,
      formula: "Índice de Regularidade = média ponderada baseada no recuo da última transação (dias) e frequência de operações.",
    },
    transactions: {
      title: "Detalhamento: Lançamentos Ativos",
      subtitle: `${summary?.activeTransactions ?? 0} lançamentos vinculados às contas`,
      formula: "Lançamentos Ativos = contagem de transações com 'account_id' associado à respectiva conta.",
    },
  };

  const current = metricTitles[metricType];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-card border-input rounded-2xl shadow-xl text-foreground max-h-[85vh] flex flex-col p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-foreground">
            {current?.title}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{current?.subtitle}</p>
        </DialogHeader>

        {/* Banner com a Fórmula Determinística */}
        <div className="p-3 rounded-lg bg-secondary/30 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold text-foreground">Fórmula e Metodologia:</p>
          <p className="">{current?.formula}</p>
        </div>

        {/* Tabela de Contas com Valores */}
        <div className="flex-1 overflow-y-auto mt-2">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-foreground">Conta / Beneficiário</TableHead>
                <TableHead className="text-foreground">Nível</TableHead>
                <TableHead className="text-right text-foreground">
                  {metricType === "transactions" ? "Lançamentos" : "Saldo / Movimento"}
                </TableHead>
                <TableHead className="text-right text-foreground">Regularidade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                    Nenhuma conta cadastrada para compor o índice.
                  </TableCell>
                </TableRow>
              ) : (
                accounts.map((acc) => {
                  const breakdownItem = summary?.breakdown?.find((b) => b.accountId === acc.id);
                  const displayValue = breakdownItem ? breakdownItem.value : acc.movement;

                  return (
                    <TableRow key={acc.id} className="border-border hover:bg-secondary/20">
                      <TableCell className="font-medium">
                        <div>
                          <p className="text-foreground">{acc.name}</p>
                          <p className="text-xs text-muted-foreground">{acc.segment || "Geral"}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs border-border">
                          {acc.tier}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {metricType === "transactions" ? (
                          <span className="font-medium text-foreground">
                            {acc.transactionCount} itens
                          </span>
                        ) : (
                          <span
                            className={
                              displayValue >= 0 ? "text-accent" : "text-destructive"
                            }
                          >
                            R${" "}
                            {displayValue.toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-xs">
                        <span className="font-semibold text-warning">
                          {acc.regularityPct}%
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
