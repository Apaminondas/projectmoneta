"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShieldCheckIcon, SparklesIcon, CheckIcon, Loader2Icon } from "lucide-react";
import { useMitigationPlan, useSaveMitigationPlan } from "@/hooks/use-moneta-api";
import type { RiskFactor } from "@/types/api";

interface MitigationPlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  risk: RiskFactor | null;
}

export function MitigationPlanModal({
  open,
  onOpenChange,
  risk,
}: MitigationPlanModalProps) {
  const riskKey = risk?.key ?? null;
  const { data: plan, isLoading } = useMitigationPlan(open ? riskKey : null);
  const saveMutation = useSaveMitigationPlan();

  const [actions, setActions] = useState("");
  const [owner, setOwner] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState("IN_PROGRESS");
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [prevPlanSync, setPrevPlanSync] = useState<{ plan: typeof plan; risk: typeof risk }>({
    plan: undefined,
    risk: null,
  });
  if (plan !== prevPlanSync.plan || risk !== prevPlanSync.risk) {
    setPrevPlanSync({ plan, risk });
    if (plan) {
      setActions(plan.actions || "");
      setOwner(plan.owner || "Diretoria Financeira");
      setDueDate(plan.dueDate ? plan.dueDate.substring(0, 10) : "");
      setStatus(plan.status || "IN_PROGRESS");
    } else if (risk) {
      setOwner("Diretoria Financeira");
      setDueDate(risk.deadline ? risk.deadline.substring(0, 10) : "");
      setStatus("IN_PROGRESS");
    }
    setSavedSuccess(false);
  }

  const handleApplySuggestion = (suggestion: string) => {
    setActions((prev) => (prev ? `${prev}\n• ${suggestion}` : `• ${suggestion}`));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!riskKey) return;

    try {
      await saveMutation.mutateAsync({
        riskKey,
        data: {
          actions,
          owner: owner.trim(),
          dueDate: dueDate || new Date().toISOString().split("T")[0],
          status,
        },
      });
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onOpenChange(false);
      }, 900);
    } catch {
      setSavedSuccess(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl bg-card border-input rounded-2xl shadow-xl text-foreground max-h-[90vh] flex flex-col p-4 sm:p-6">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="border-accent/40 bg-accent/10 text-accent text-xs rounded-lg">
              Plano de Mitigação
            </Badge>
            <span className="text-xs text-muted-foreground">{risk?.key}</span>
          </div>
          <DialogTitle className="text-base font-semibold text-foreground tracking-tight">
            {risk?.title}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Ações preventivas e corretivas com rastreabilidade de regras.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <Loader2Icon className="h-5 w-5 animate-spin text-accent" strokeWidth={1.5} />
            <span className="text-xs">Carregando plano e diagnósticos...</span>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4 overflow-y-auto pr-1">
            {/* Regra Geradora */}
            <div className="rounded-lg bg-muted/40 p-3 space-y-1">
              <span className="text-xs font-semibold text-muted-foreground block">
                Regra Geradora do Diagnóstico
              </span>
              <p className="text-xs text-foreground/90 font-medium">
                {plan?.ruleReason || "Regra Determinística de Alerta de Tetos e Prazos Operacionais."}
              </p>
            </div>

            {/* Sugestões Geradas por Regras */}
            {plan?.ruleSuggestions && plan.ruleSuggestions.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <SparklesIcon className="h-3.5 w-3.5 text-accent" strokeWidth={1.5} />
                  <span className="text-xs font-semibold text-muted-foreground">
                    Sugestões Determinísticas do Sistema
                  </span>
                </div>
                <div className="space-y-1 divide-y divide-border/60">
                  {plan.ruleSuggestions.map((sug, idx) => (
                    <div
                      key={idx}
                      className="py-2.5 flex items-start justify-between gap-3 text-xs"
                    >
                      <span className="text-foreground/90">{sug}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        className="min-h-11 sm:min-h-8 px-2 py-1 text-xs shrink-0 text-accent hover:text-accent hover:bg-accent/10 rounded-lg"
                        onClick={() => handleApplySuggestion(sug)}
                      >
                        + Aplicar
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ações */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Ações de Mitigação Planejadas *
              </label>
              <Textarea
                required
                rows={3}
                value={actions}
                onChange={(e) => setActions(e.target.value)}
                placeholder="Ex: Renegociar alíquota com fornecedor, acionar trava cambial ou readequar limites de centros..."
                className="w-full rounded-lg bg-secondary/40 border border-input text-foreground text-xs p-3 placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-colors duration-150 resize-none"
              />
            </div>

            {/* Responsável e Prazo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Responsável pela Execução *
                </label>
                <Input
                  required
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  placeholder="Nome do gestor ou departamento"
                  className="w-full h-11 sm:h-9 px-3 rounded-lg bg-secondary/40 border border-input text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-colors duration-150"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Prazo Limite *
                </label>
                <Input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full h-11 sm:h-9 px-3 rounded-lg bg-secondary/40 border border-input text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-colors duration-150"
                />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Status do Plano</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border rounded-lg text-foreground">
                  <SelectItem value="IN_PROGRESS" className="text-xs">
                    Em Andamento (In Progress)
                  </SelectItem>
                  <SelectItem value="UNDER_REVIEW" className="text-xs">
                    Em Revisão pela Diretoria
                  </SelectItem>
                  <SelectItem value="COMPLETED" className="text-xs">
                    Concluído e Mitigado
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Footer */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
              <button
                type="button"
                className="min-h-11 sm:min-h-9 px-4 py-2 rounded-lg border border-input bg-secondary text-xs font-medium text-foreground hover:bg-secondary/80 transition-colors duration-150 cursor-pointer"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saveMutation.isPending || savedSuccess}
                className="min-h-11 sm:min-h-9 px-4 py-2 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 text-xs font-semibold transition-colors duration-150 cursor-pointer inline-flex items-center justify-center gap-1.5"
              >
                {saveMutation.isPending ? (
                  <>
                    <Loader2Icon data-icon="inline-start" className="h-4 w-4 animate-spin" strokeWidth={1.5} />
                    Salvando...
                  </>
                ) : savedSuccess ? (
                  <>
                    <CheckIcon data-icon="inline-start" strokeWidth={1.5} />
                    Plano Salvo!
                  </>
                ) : (
                  <>
                    <ShieldCheckIcon data-icon="inline-start" strokeWidth={1.5} />
                    Salvar Plano de Mitigação
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
