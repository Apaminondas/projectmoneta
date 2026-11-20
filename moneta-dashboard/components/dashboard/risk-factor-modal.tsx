"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangleIcon, CheckIcon, Loader2Icon } from "lucide-react";
import { useCategories, useCreateManualRisk } from "@/hooks/use-moneta-api";

interface RiskFactorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RiskFactorModal({ open, onOpenChange }: RiskFactorModalProps) {
  const { data: categories } = useCategories();
  const createMutation = useCreateManualRisk();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Geral");
  const [severity, setSeverity] = useState("medium");
  const [estimatedAmount, setEstimatedAmount] = useState("");
  const [description, setDescription] = useState("");
  const [relatedDealsInput, setRelatedDealsInput] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(estimatedAmount);
    if (isNaN(amount) || amount <= 0) return;

    const deals = relatedDealsInput
      ? relatedDealsInput
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    try {
      await createMutation.mutateAsync({
        title: title.trim(),
        category,
        severity,
        estimatedAmount: amount,
        description: description.trim(),
        relatedDeals: deals,
      });

      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        setTitle("");
        setCategory("Geral");
        setSeverity("medium");
        setEstimatedAmount("");
        setDescription("");
        setRelatedDealsInput("");
        onOpenChange(false);
      }, 800);
    } catch {
      setSavedSuccess(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-input rounded-2xl shadow-xl text-foreground">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-foreground tracking-tight flex items-center gap-2">
            <AlertTriangleIcon className="h-4 w-4 text-accent" strokeWidth={1.5} />
            Novo Fator de Risco Manual
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Adicione uma variável de risco operacional ou financeiro identificado pela gestão.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-2">
          {/* Título */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Título do Risco *</label>
            <Input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Volatilidade Câmbio Dólar (AWS e SaaS)"
              className="w-full h-11 sm:h-9 px-3 rounded-lg bg-secondary/40 border border-input text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-colors duration-150"
            />
          </div>

          {/* Categoria e Severidade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Centro / Categoria *</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border rounded-lg text-foreground">
                  <SelectItem value="Geral" className="text-xs">
                    Geral
                  </SelectItem>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name} className="text-xs">
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Severidade *</label>
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger>
                  <SelectValue placeholder="Severidade" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border rounded-lg text-foreground">
                  <SelectItem value="high" className="text-xs text-destructive">
                    Alta
                  </SelectItem>
                  <SelectItem value="medium" className="text-xs text-warning">
                    Média
                  </SelectItem>
                  <SelectItem value="low" className="text-xs text-chart-1">
                    Baixa
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Valor Estimado em Risco */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Impacto Estimado (R$) *</label>
            <Input
              type="number"
              step="0.01"
              required
              min="0.01"
              value={estimatedAmount}
              onChange={(e) => setEstimatedAmount(e.target.value)}
              placeholder="Ex: 5000.00"
              className="w-full h-11 sm:h-9 px-3 rounded-lg bg-secondary/40 border border-input text-xs tabular-nums text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-colors duration-150"
            />
          </div>

          {/* Itens / Contratos Relacionados */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Contratos / Itens Relacionados (separados por vírgula)
            </label>
            <Input
              value={relatedDealsInput}
              onChange={(e) => setRelatedDealsInput(e.target.value)}
              placeholder="Ex: AWS Cloud, Aluguel Sede, Oracle"
              className="w-full h-11 sm:h-9 px-3 rounded-lg bg-secondary/40 border border-input text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-colors duration-150"
            />
          </div>

          {/* Descrição */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Descrição do Risco *</label>
            <Textarea
              required
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva as causas e os impactos esperados na saúde financeira..."
              className="w-full rounded-lg bg-secondary/40 border border-input text-foreground text-xs p-3 placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-colors duration-150 resize-none"
            />
          </div>

          {/* Footer */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
            <button
              type="button"
              className="min-h-11 sm:min-h-9 px-4 rounded-lg border border-input bg-secondary text-xs font-medium text-foreground hover:bg-secondary/80 transition-colors duration-150 cursor-pointer"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || savedSuccess}
              className="min-h-11 sm:min-h-9 px-4 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 text-xs font-semibold transition-colors duration-150 cursor-pointer inline-flex items-center justify-center gap-1.5"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2Icon data-icon="inline-start" className="animate-spin" strokeWidth={1.5} />
                  Salvando...
                </>
              ) : savedSuccess ? (
                <>
                  <CheckIcon data-icon="inline-start" strokeWidth={1.5} />
                  Risco Cadastrado!
                </>
              ) : (
                <>
                  <AlertTriangleIcon data-icon="inline-start" strokeWidth={1.5} />
                  Cadastrar Risco
                </>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
