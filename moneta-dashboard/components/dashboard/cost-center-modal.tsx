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
import { useUpdateCostCenter } from "@/hooks/use-moneta-api";
import type { CostCenter, CostCenterUpdateRequest } from "@/types/api";

interface CostCenterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  costCenter: CostCenter | null;
}

const colorTokenOptions = [
  { value: "chart-1", label: "Âmbar (chart-1)" },
  { value: "chart-2", label: "Verde (chart-2)" },
  { value: "chart-3", label: "Vermelho Suave (chart-3)" },
  { value: "chart-4", label: "Azul Acinzentado (chart-4)" },
  { value: "chart-5", label: "Cinza Claro (chart-5)" },
];

const kindOptions = [
  { value: "FIXED", label: "Custo Fixo" },
  { value: "VARIABLE", label: "Custo Variável" },
  { value: "INVESTMENT", label: "Investimento" },
  { value: "SERVICE", label: "Serviço Especializado" },
  { value: "SUBSCRIPTION", label: "Assinaturas & SaaS" },
];

export function CostCenterModal({ open, onOpenChange, costCenter }: CostCenterModalProps) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState("VARIABLE");
  const [colorToken, setColorToken] = useState("chart-1");
  const [ceiling, setCeiling] = useState("0");
  const [contactName, setContactName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const updateCostCenterMutation = useUpdateCostCenter();

  const syncKey = open ? `open:${costCenter?.categoryId ?? "none"}` : "closed";
  const [prevSyncKey, setPrevSyncKey] = useState(syncKey);
  if (syncKey !== prevSyncKey) {
    setPrevSyncKey(syncKey);
    if (costCenter) {
      setName(costCenter.name);
      setKind(costCenter.kind || "VARIABLE");
      setColorToken(costCenter.colorToken || "chart-1");
      setCeiling(String(costCenter.ceiling || 0));
      setContactName(costCenter.contact?.name || "");
    }
    setErrorMessage("");
  }

  if (!costCenter) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!name.trim()) {
      setErrorMessage("O nome do centro de custo é obrigatório.");
      return;
    }

    const ceilingNum = parseFloat(ceiling.replace(",", "."));
    if (isNaN(ceilingNum) || ceilingNum < 0) {
      setErrorMessage("O teto mensal deve ser um valor maior ou igual a zero.");
      return;
    }

    const payload: CostCenterUpdateRequest = {
      name: name.trim(),
      kind,
      colorToken,
      monthlyCeiling: ceilingNum,
      contact: contactName.trim()
        ? {
            name: contactName.trim(),
            email: costCenter.contact?.email || undefined,
            phone: costCenter.contact?.phone || undefined,
          }
        : undefined,
    };

    try {
      await updateCostCenterMutation.mutateAsync({
        categoryId: costCenter.categoryId,
        data: payload,
      });
      onOpenChange(false);
    } catch {
      setErrorMessage("Não foi possível salvar o centro de custo. Confira os dados e tente novamente.");
    }
  };

  const isPending = updateCostCenterMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-input rounded-2xl shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-foreground">
            Editar Perfil do Centro de Custo
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Ajuste as definições de orçamento e responsabilidade deste departamento.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {errorMessage && (
            <div className="p-3 text-xs rounded-lg bg-destructive/15 text-destructive">
              {errorMessage}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <label htmlFor="cc-name" className="text-xs font-medium text-muted-foreground block">
                Nome do Centro de Custo *
              </label>
              <input
                id="cc-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Infraestrutura Cloud"
                className="w-full h-11 sm:h-9 px-3 rounded-lg bg-secondary/40 border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-colors duration-150"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="cc-kind" className="text-xs font-medium text-muted-foreground block">
                Tipo / Natureza *
              </label>
              <select
                id="cc-kind"
                value={kind}
                onChange={(e) => setKind(e.target.value)}
                className="w-full h-11 sm:h-9 px-3 rounded-lg bg-secondary/40 border border-input text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-colors duration-150 cursor-pointer"
              >
                {kindOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-popover text-foreground">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="cc-color" className="text-xs font-medium text-muted-foreground block">
                Cor Semântica *
              </label>
              <select
                id="cc-color"
                value={colorToken}
                onChange={(e) => setColorToken(e.target.value)}
                className="w-full h-11 sm:h-9 px-3 rounded-lg bg-secondary/40 border border-input text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-colors duration-150 cursor-pointer"
              >
                {colorTokenOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-popover text-foreground">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-2 space-y-1.5">
              <label htmlFor="cc-ceiling" className="text-xs font-medium text-muted-foreground block">
                Teto Orçamentário Mensal (R$) *
              </label>
              <input
                id="cc-ceiling"
                type="number"
                step="0.01"
                min="0"
                value={ceiling}
                onChange={(e) => setCeiling(e.target.value)}
                placeholder="Ex: 5000.00"
                className="w-full h-11 sm:h-9 px-3 rounded-lg bg-secondary/40 border border-input text-sm tabular-nums text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-colors duration-150"
                required
              />
            </div>
          </div>

          <div className="pt-2 border-t border-border/60">
            <h3 className="text-xs font-medium text-muted-foreground mb-3">
              Responsabilidade Orçamentária
            </h3>
            <div className="space-y-1.5">
              <label htmlFor="cc-contact-name" className="text-xs font-medium text-muted-foreground block">
                Nome do Responsável / Liderança
              </label>
              <input
                id="cc-contact-name"
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Ex: Gerência de Infra / DevOps"
                className="w-full h-11 sm:h-9 px-3 rounded-lg bg-secondary/40 border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-colors duration-150"
              />
            </div>
          </div>

          <DialogFooter className="sm:justify-end gap-2 pt-2">
            <button
              type="button"
              className="min-h-11 sm:min-h-9 px-4 py-2 rounded-lg border border-input bg-secondary text-xs font-medium text-foreground hover:bg-secondary/80 transition-colors duration-150 cursor-pointer"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="min-h-11 sm:min-h-9 px-4 py-2 rounded-lg bg-accent hover:bg-accent/90 text-accent-foreground text-xs font-semibold transition-colors duration-150 cursor-pointer"
              disabled={isPending}
            >
              {isPending ? "Salvando..." : "Salvar Centro de Custo"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
