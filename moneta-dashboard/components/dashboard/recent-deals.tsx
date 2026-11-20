"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ArrowUpRightIcon, ClockIcon, CheckCircle2Icon, XCircleIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { RecentDealItem } from "@/lib/adapters";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

const statusConfig = {
  won: {
    icon: CheckCircle2Icon,
    color: "text-success",
    bg: "bg-success/10 border-success/35",
    label: "Concluído",
  },
  pending: {
    icon: ClockIcon,
    color: "text-warning",
    bg: "bg-warning/10 border-warning/35",
    label: "Pendente",
  },
  lost: {
    icon: XCircleIcon,
    color: "text-destructive",
    bg: "bg-destructive/10 border-destructive/35",
    label: "Cancelado",
  },
};

export function RecentDeals({
  items,
  isLoading = false,
  isError = false,
  onViewAll,
}: {
  items?: RecentDealItem[];
  isLoading?: boolean;
  isError?: boolean;
  onViewAll?: () => void;
} = {}) {
  const [selectedDeal, setSelectedDeal] = useState<RecentDealItem | null>(null);
  const displayItems = items ?? [];

  return (
    <>
      <div className="bg-card border border-border rounded-2xl p-5 flex flex-col h-full min-w-0 shadow-xs">
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-border">
          <div className="min-w-0">
            <h2 className="text-[15px] leading-5 font-semibold tracking-tight text-foreground whitespace-nowrap">
              Últimos Lançamentos
            </h2>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              Atividade recente
            </p>
          </div>
          <button
            type="button"
            onClick={onViewAll}
            className="min-h-11 md:min-h-8 px-2.5 inline-flex items-center gap-1.5 rounded-lg border border-input bg-transparent hover:bg-secondary text-[13px] text-foreground transition-colors duration-150 shrink-0"
          >
            <span>Ver todos</span>
            <ArrowUpRightIcon data-icon="inline-end" className="w-4 h-4 text-accent" strokeWidth={1.5} />
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : isError ? (
          <div className="py-12 text-center text-xs text-destructive">
            Erro ao carregar lançamentos recentes.
          </div>
        ) : displayItems.length === 0 ? (
          <div className="py-12 my-4 text-center border border-dashed border-border rounded-xl text-xs text-muted-foreground">
            Sem dados no período
          </div>
        ) : (
          <div className="divide-y divide-border">
            {displayItems.map((deal, index) => {
              const status = statusConfig[deal.status as keyof typeof statusConfig];
              const StatusIcon = status.icon;

              return (
                <button
                  key={`${deal.id ?? deal.company}-${index}`}
                  type="button"
                  onClick={() => setSelectedDeal(deal)}
                  className="w-[calc(100%+0.75rem)] text-left min-h-[56px] py-2.5 px-2 -mx-1.5 flex items-center justify-between gap-3 rounded-xl hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors duration-150 cursor-pointer"
                >
                  <div className="min-w-0 flex-1">
                    <p
                      title={deal.company}
                      className="text-sm font-medium text-foreground line-clamp-2"
                    >
                      {deal.company}
                    </p>
                    <p className="text-[13px] text-muted-foreground truncate mt-0.5">
                      {deal.rep} • {deal.date}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center items-end gap-1.5 sm:gap-3 shrink-0 text-right">
                    <div
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-medium whitespace-nowrap",
                        status.bg,
                        status.color
                      )}
                    >
                      <StatusIcon className="w-3.5 h-3.5" strokeWidth={1.5} />
                      <span>{status.label}</span>
                    </div>
                    <span className="text-sm font-bold tabular-nums text-foreground text-right sm:min-w-[112px]">
                      {deal.value}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={!!selectedDeal} onOpenChange={(open: boolean) => !open && setSelectedDeal(null)}>
        {selectedDeal && (
          <DialogContent className="sm:max-w-lg bg-card border-input rounded-2xl shadow-xl p-6 space-y-5">
            <DialogHeader className="text-left space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border",
                    statusConfig[selectedDeal.status as keyof typeof statusConfig]?.bg,
                    statusConfig[selectedDeal.status as keyof typeof statusConfig]?.color
                  )}
                >
                  {(() => {
                    const StatusIcon = statusConfig[selectedDeal.status as keyof typeof statusConfig]?.icon;
                    return StatusIcon ? <StatusIcon className="w-3.5 h-3.5" strokeWidth={1.5} /> : null;
                  })()}
                  <span>{statusConfig[selectedDeal.status as keyof typeof statusConfig]?.label}</span>
                </div>
                <span className="text-xs text-muted-foreground">{selectedDeal.id ? `#${selectedDeal.id}` : ""}</span>
              </div>
              <DialogTitle className="text-base font-semibold text-foreground leading-snug">
                {selectedDeal.company}
              </DialogTitle>
            </DialogHeader>

            {/* 3 Chips Horizontais */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-secondary/30 text-center text-xs">
              <div className="space-y-0.5">
                <span className="text-muted-foreground block text-[11px]">Valor</span>
                <span className="font-bold text-foreground text-sm tabular-nums">
                  {selectedDeal.value}
                </span>
              </div>
              <div className="space-y-0.5 border-x border-border/50">
                <span className="text-muted-foreground block text-[11px]">Operação</span>
                <span className={cn("font-semibold text-xs", selectedDeal.type === "INCOME" ? "text-green-500" : "text-rose-400")}>
                  {selectedDeal.type === "INCOME" ? "Receita" : "Despesa"}
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-muted-foreground block text-[11px]">Data</span>
                <span className="font-medium text-foreground text-xs tabular-nums">
                  {selectedDeal.date}
                </span>
              </div>
            </div>

            {/* Metadados Adicionais */}
            <div className="p-3.5 rounded-xl bg-secondary/20 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Categoria / Favorecido:</span>
                <span className="font-medium text-foreground">{selectedDeal.rep}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Método de Liquidação:</span>
                <span className="font-medium text-foreground">
                  {selectedDeal.paymentMethod || "Não informado"}
                </span>
              </div>
            </div>

            {selectedDeal.notes && (
              <div className="text-xs space-y-1 pt-2 border-t border-border/60">
                <span className="text-muted-foreground block font-medium">Observações:</span>
                <p className="text-foreground text-xs leading-relaxed">
                  {selectedDeal.notes}
                </p>
              </div>
            )}

            <DialogFooter className="pt-2">
              <DialogClose asChild>
                <button
                  type="button"
                  className="min-h-10 px-4 py-2 rounded-lg border border-input text-xs font-medium text-foreground hover:bg-secondary/60 transition-colors w-full cursor-pointer"
                >
                  Fechar
                </button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
