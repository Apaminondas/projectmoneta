"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarIcon, ShieldCheckIcon, ExternalLinkIcon } from "lucide-react";
import type { RiskFactor } from "@/types/api";

interface RiskDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  risk: RiskFactor | null;
  onOpenMitigation: (risk: RiskFactor) => void;
  onNavigateSection?: (section: string) => void;
}

export function RiskDetailsModal({
  open,
  onOpenChange,
  risk,
  onOpenMitigation,
  onNavigateSection,
}: RiskDetailsModalProps) {
  if (!risk) return null;

  const severityStyles: Record<string, { label: string; className: string }> = {
    high: {
      label: "Severidade Alta",
      className: "border-destructive/30 bg-destructive/10 text-destructive",
    },
    medium: {
      label: "Severidade Média",
      className: "border-warning/30 bg-warning/10 text-warning",
    },
    low: {
      label: "Severidade Baixa",
      className: "border-chart-1/30 bg-chart-1/10 text-chart-1",
    },
  };

  const severity = severityStyles[risk.severity] || severityStyles.medium;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl bg-card border-input rounded-2xl shadow-xl text-foreground p-4 sm:p-6">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className={`text-xs rounded-lg ${severity.className}`}>
              {severity.label}
            </Badge>
            <Badge
              variant="outline"
              className={`text-xs rounded-lg ${
                risk.origin === "AUTOMATIC"
                  ? "border-accent/40 bg-accent/10 text-accent"
                  : "border-accent/40 bg-accent/10 text-accent"
              }`}
            >
              {risk.origin === "AUTOMATIC" ? "Regra Automática" : "Cadastro Manual"}
            </Badge>
          </div>
          <DialogTitle className="text-base sm:text-lg font-semibold text-foreground tracking-tight">
            {risk.title}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Categoria associada: <span className="text-foreground font-medium">{risk.category}</span>
          </p>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Métricas do Risco */}
          <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-secondary/30 text-center text-xs">
            <div className="space-y-0.5">
              <span className="text-muted-foreground block text-[11px]">Impacto Estimado</span>
              <span className="font-bold text-foreground text-sm tabular-nums">
                R$ {Number(risk.estimatedAmount || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="space-y-0.5 border-l border-border/50">
              <span className="text-muted-foreground block text-[11px] flex items-center justify-center gap-1">
                <CalendarIcon className="h-3 w-3" strokeWidth={1.5} /> Prazo
              </span>
              <span className="font-bold text-foreground text-sm tabular-nums">
                {risk.deadline ? new Date(risk.deadline).toLocaleDateString("pt-BR") : "A Definir"}
              </span>
            </div>
          </div>

          {/* Descrição */}
          <div className="rounded-lg bg-background/70 p-3 space-y-1">
            <span className="text-xs font-semibold text-muted-foreground block">
              Descrição do Diagnóstico
            </span>
            <p className="text-xs sm:text-sm text-foreground/90">{risk.description}</p>
          </div>

          {/* Itens e Contas Reais Relacionados */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-muted-foreground block">
              Lançamentos e Contas Reais Relacionados
            </span>
            {risk.relatedDeals && risk.relatedDeals.length > 0 ? (
              <div className="space-y-1.5">
                {risk.relatedDeals.map((deal, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/20 text-xs text-foreground"
                  >
                    <span className="">{deal}</span>
                    {onNavigateSection && (
                      <Button
                        variant="ghost"
                        className="min-h-11 sm:min-h-8 px-2 text-xs gap-1 text-accent hover:text-accent rounded-lg"
                        onClick={() => {
                          onOpenChange(false);
                          if (deal.toLowerCase().includes("conta") || deal.toLowerCase().includes("banco")) {
                            onNavigateSection("customers");
                          } else {
                            onNavigateSection("team");
                          }
                        }}
                      >
                        Ver no Módulo <ExternalLinkIcon data-icon="inline-end" className="h-3 w-3" strokeWidth={1.5} />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                Nenhum vínculo direto identificado nas regras determinísticas.
              </p>
            )}
          </div>

          {/* Ações */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-border/60">
            <button
              type="button"
              className="min-h-11 sm:min-h-9 px-4 rounded-lg border border-input bg-secondary text-xs font-medium text-foreground hover:bg-secondary/80 transition-colors duration-150 cursor-pointer"
              onClick={() => onOpenChange(false)}
            >
              Fechar
            </button>
            <button
              type="button"
              className="min-h-11 sm:min-h-9 px-4 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 text-xs font-semibold transition-colors duration-150 cursor-pointer inline-flex items-center justify-center gap-1.5"
              onClick={() => {
                onOpenChange(false);
                onOpenMitigation(risk);
              }}
            >
              <ShieldCheckIcon data-icon="inline-start" className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Ver Plano de Mitigação</span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
