"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { TrophyIcon, TrendingUpIcon, TrendingDownIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { PerformerItem, RecentDealItem } from "@/lib/adapters";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

export function TopPerformers({
  performers,
  isLoading = false,
  isError = false,
}: {
  performers?: PerformerItem[];
  isLoading?: boolean;
  isError?: boolean;
} = {}) {
  const [selectedPerformer, setSelectedPerformer] = useState<PerformerItem | null>(null);
  const displayPerformers = performers ?? [];

  return (
    <>
      <div className="bg-card border border-border rounded-2xl p-5 flex flex-col h-full min-w-0 shadow-xs">
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-border">
          <div className="min-w-0">
            <h2 className="text-[15px] leading-5 font-semibold tracking-tight text-foreground whitespace-nowrap">
              Maiores Categorias
            </h2>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              Lançamentos do mês
            </p>
          </div>
          <TrophyIcon className="w-4 h-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
        </div>

        {isLoading ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : isError ? (
          <div className="py-12 text-center text-xs text-destructive">
            Erro ao carregar maiores categorias.
          </div>
        ) : displayPerformers.length === 0 ? (
          <div className="py-12 my-4 text-center border border-dashed border-border rounded-xl text-xs text-muted-foreground">
            Sem dados no período
          </div>
        ) : (
          <div className="divide-y divide-border">
            {displayPerformers.map((person) => (
              <button
                key={person.id ?? person.name}
                type="button"
                onClick={() => setSelectedPerformer(person)}
                className="w-[calc(100%+0.75rem)] text-left min-h-[56px] py-2.5 px-2 -mx-1.5 flex items-center justify-between gap-3 rounded-xl hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors duration-150 cursor-pointer"
              >
                <div className="flex items-baseline gap-3 min-w-0 flex-1">
                  <span
                    className={cn(
                      "text-xs font-semibold tabular-nums w-5 shrink-0",
                      person.rank === 1 ? "text-warning font-bold" : "text-muted-foreground"
                    )}
                  >
                    {person.rank}.
                  </span>
                  <div className="min-w-0">
                    <p
                      title={person.name}
                      className="text-sm font-medium text-foreground line-clamp-2"
                    >
                      {person.name}
                    </p>
                    <p className="text-xs tabular-nums text-muted-foreground mt-0.5">
                      {person.deals} lançamentos
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0 tabular-nums">
                  <p className="text-sm font-bold text-foreground text-right">
                    {person.revenue}
                  </p>
                  <div
                    className={cn(
                      "inline-flex items-center justify-end gap-1 text-xs mt-0.5",
                      person.changeType === "positive" && "text-success",
                      person.changeType === "negative" && "text-destructive",
                      person.changeType === "neutral" && "text-muted-foreground"
                    )}
                  >
                    {person.changeType === "positive" && (
                      <TrendingDownIcon className="w-3.5 h-3.5" strokeWidth={1.5} />
                    )}
                    {person.changeType === "negative" && (
                      <TrendingUpIcon className="w-3.5 h-3.5" strokeWidth={1.5} />
                    )}
                    <span>{person.change}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!selectedPerformer} onOpenChange={(open: boolean) => !open && setSelectedPerformer(null)}>
        {selectedPerformer && (
          <DialogContent className="sm:max-w-xl bg-card border-input rounded-2xl shadow-xl p-6 space-y-5">
            <DialogHeader className="space-y-1 text-left">
              <div className="flex items-center justify-between gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/30 text-accent text-xs font-semibold">
                  Ranking #{selectedPerformer.rank}
                </span>
                <span className="text-xs text-muted-foreground">
                  {selectedPerformer.deals} lançamentos auditados
                </span>
              </div>
              <DialogTitle className="text-lg font-semibold text-foreground leading-snug">
                {selectedPerformer.name}
              </DialogTitle>
            </DialogHeader>

            {/* Banner de Total */}
            <div className="p-4 rounded-xl bg-secondary/40 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs text-muted-foreground block mb-0.5">Total Gasto Consolidado</span>
                <span className="text-2xl sm:text-3xl font-bold tabular-nums text-foreground tracking-tight">
                  {selectedPerformer.revenue}
                </span>
              </div>
              <div
                className={cn(
                  "inline-flex items-center gap-1.5 text-xs border px-3 py-1 rounded-full font-semibold",
                  selectedPerformer.changeType === "positive" &&
                    "text-green-500 bg-green-500/10 border-green-500/30",
                  selectedPerformer.changeType === "negative" &&
                    "text-rose-400 bg-rose-500/10 border-rose-500/30",
                  selectedPerformer.changeType === "neutral" &&
                    "text-muted-foreground bg-secondary border-border"
                )}
              >
                {selectedPerformer.changeType === "positive" && (
                  <TrendingDownIcon className="w-3.5 h-3.5" strokeWidth={2} />
                )}
                {selectedPerformer.changeType === "negative" && (
                  <TrendingUpIcon className="w-3.5 h-3.5" strokeWidth={2} />
                )}
                <span>
                  {selectedPerformer.change === "—"
                    ? "—"
                    : `${selectedPerformer.change} vs. mês anterior`}
                </span>
              </div>
            </div>

            {/* Lista Limpa com Largura Confortável */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground px-1 pb-1 border-b border-border">
                <span className="font-medium">Lançamentos Recentes ({selectedPerformer.transactions?.length || 0})</span>
                <span>Valor e Registro</span>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-border/60 pr-1 space-y-1">
                {selectedPerformer.transactions && selectedPerformer.transactions.length > 0 ? (
                  selectedPerformer.transactions.map((tx: RecentDealItem, idx: number) => (
                    <div
                      key={`${tx.id ?? tx.company}-${idx}`}
                      className="flex items-start justify-between gap-4 py-2.5 px-2 rounded-xl hover:bg-secondary/30 transition-colors"
                    >
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <p className="text-xs font-medium text-foreground leading-snug">{tx.company}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {tx.date} • {tx.paymentMethod || "Não informado"}
                        </p>
                        {tx.notes && (
                          <p className="text-[11px] text-muted-foreground/80 line-clamp-2 mt-0.5">
                            {tx.notes}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold tabular-nums text-foreground">
                          {tx.value}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    Sem dados no período
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="flex items-center justify-between pt-2 border-t border-border/50">
              <span className="text-xs text-muted-foreground">Dados consolidados via API REST</span>
              <DialogClose asChild>
                <button
                  type="button"
                  className="min-h-10 px-5 py-2 rounded-lg bg-secondary text-xs font-medium text-foreground hover:bg-secondary/80 border border-input transition-colors"
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
