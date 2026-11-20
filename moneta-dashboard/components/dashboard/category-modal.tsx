"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useCreateCategory } from "@/hooks/use-moneta-api";
import { cn } from "@/lib/utils";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLOR_TOKENS = [
  { token: "chart-1", label: "Ciano", color: "bg-chart-1" },
  { token: "chart-2", label: "Esmeralda", color: "bg-chart-2" },
  { token: "chart-3", label: "Âmbar", color: "bg-chart-3" },
  { token: "chart-4", label: "Carmesim", color: "bg-chart-4" },
  { token: "chart-5", label: "Violeta", color: "bg-chart-5" },
];

const KINDS = [
  { value: "VARIABLE", label: "Custo Variável" },
  { value: "FIXED", label: "Custo Fixo" },
  { value: "INVESTMENT", label: "Investimento" },
  { value: "SERVICE", label: "Serviço Especializado" },
  { value: "SUBSCRIPTION", label: "Assinaturas & SaaS" },
];

export function CategoryModal({ isOpen, onClose }: CategoryModalProps) {
  const createMutation = useCreateCategory();

  const [name, setName] = useState("");
  const [colorToken, setColorToken] = useState("chart-1");
  const [monthlyCeiling, setMonthlyCeiling] = useState("");
  const [kind, setKind] = useState("VARIABLE");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg("O nome da categoria é obrigatório.");
      return;
    }

    const ceilingNum = monthlyCeiling ? parseFloat(monthlyCeiling) : null;
    if (ceilingNum !== null && (isNaN(ceilingNum) || ceilingNum <= 0)) {
      setErrorMsg("O teto mensal deve ser um valor positivo.");
      return;
    }

    try {
      await createMutation.mutateAsync({
        name: name.trim(),
        colorToken,
        monthlyCeiling: ceilingNum,
        kind,
      });
      setName("");
      setColorToken("chart-1");
      setMonthlyCeiling("");
      setKind("VARIABLE");
      onClose();
    } catch {
      setErrorMsg("Não foi possível criar a categoria. Tente novamente em instantes.");
    }
  };

  const isPending = createMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-card border-input rounded-2xl shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-foreground">
            Nova Categoria
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Cadastre uma nova coluna de acompanhamento e limite orçamentário.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-destructive/15 text-xs text-destructive">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground block">
              Nome da Categoria *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Equipamentos & Hardware TI"
              className="w-full h-11 sm:h-9 px-3 rounded-lg bg-secondary/40 border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-colors duration-150"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground block">
              Cor do Centro de Custo
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {COLOR_TOKENS.map((item) => (
                <button
                  key={item.token}
                  type="button"
                  onClick={() => setColorToken(item.token)}
                  className={cn(
                    "min-h-11 sm:min-h-9 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-colors duration-150 cursor-pointer",
                    colorToken === item.token
                      ? "border-accent bg-secondary text-foreground font-semibold ring-1 ring-accent/30"
                      : "border-input bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  <span className={cn("w-2 h-2 rounded-[1px]", item.color)} />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground block">
                Teto Mensal (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={monthlyCeiling}
                onChange={(e) => setMonthlyCeiling(e.target.value)}
                placeholder="Ex: 5000,00"
                className="w-full h-11 sm:h-9 px-3 rounded-lg bg-secondary/40 border border-input text-sm tabular-nums text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-colors duration-150"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground block">
                Tipo Orçamentário
              </label>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value)}
                className="w-full h-11 sm:h-9 px-3 rounded-lg bg-secondary/40 border border-input text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-colors duration-150 cursor-pointer"
              >
                {KINDS.map((k) => (
                  <option key={k.value} value={k.value} className="bg-popover text-foreground">
                    {k.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter className="sm:justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="min-h-11 sm:min-h-9 px-4 py-2 rounded-lg border border-input bg-secondary text-xs font-medium text-foreground hover:bg-secondary/80 transition-colors duration-150 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="min-h-11 sm:min-h-9 px-4 py-2 rounded-lg bg-accent text-accent-foreground text-xs font-semibold hover:bg-accent/90 transition-colors duration-150 cursor-pointer"
            >
              {isPending ? "Criando..." : "Criar Categoria"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
