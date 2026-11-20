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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { useCategories, useCreateTransaction, useUpdateTransaction } from "@/hooks/use-moneta-api";
import type { TransactionRequest, TransactionType, TransactionStatus } from "@/types/api";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: (Partial<TransactionRequest> & { id?: number }) | null;
  defaultCategoryId?: number;
  defaultType?: TransactionType;
}

function getLocalDateString(d = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateDisplay(isoDateStr: string): string {
  if (!isoDateStr) return "";
  const parts = isoDateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return isoDateStr;
}

export function TransactionModal({
  isOpen,
  onClose,
  initialData,
  defaultCategoryId,
  defaultType = "EXPENSE",
}: TransactionModalProps) {
  const isEditing = Boolean(initialData?.id);
  const { data: categories = [] } = useCategories();
  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [type, setType] = useState<TransactionType>(defaultType);
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [status, setStatus] = useState<TransactionStatus>("COMPLETED");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [notes, setNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const syncKey = isOpen ? `open:${initialData?.id ?? "new"}:${defaultCategoryId ?? ""}:${defaultType}` : "closed";
  const [prevSyncKey, setPrevSyncKey] = useState(syncKey);
  if (syncKey !== prevSyncKey) {
    setPrevSyncKey(syncKey);
    if (isOpen) {
      if (initialData) {
        setDescription(initialData.description || "");
        setAmount(initialData.amount ? String(initialData.amount) : "");
        setDate(initialData.date || getLocalDateString());
        setType(initialData.type || defaultType);
        setCategoryId(initialData.categoryId || defaultCategoryId || (categories[0]?.id ?? ""));
        setStatus(initialData.status || "COMPLETED");
        setPaymentMethod(initialData.paymentMethod || "Transferência TED");
        setNotes(initialData.notes || "");
      } else {
        setDescription("");
        setAmount("");
        setDate(getLocalDateString());
        setType(defaultType);
        setCategoryId(defaultCategoryId || (categories[0]?.id ?? ""));
        setStatus("COMPLETED");
        setPaymentMethod("Transferência TED");
        setNotes("");
      }
      setErrorMsg(null);
      setIsCalendarOpen(false);
    }
  }

  const [prevCatsLen, setPrevCatsLen] = useState(categories.length);
  if (categories.length !== prevCatsLen) {
    setPrevCatsLen(categories.length);
    if (isOpen && (categoryId === "" || categoryId === undefined) && categories.length > 0) {
      setCategoryId(defaultCategoryId || categories[0].id);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!description.trim()) {
      setErrorMsg("A descrição é obrigatória.");
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg("O valor deve ser positivo e maior que zero.");
      return;
    }

    if (!date) {
      setErrorMsg("A data é obrigatória.");
      return;
    }

    const todayLocal = getLocalDateString();
    if (type === "EXPENSE" && date > todayLocal) {
      setErrorMsg("Despesas não podem ser lançadas com data futura.");
      return;
    }

    const targetCategoryId = typeof categoryId === "number" ? categoryId : categories[0]?.id;
    if (!targetCategoryId) {
      setErrorMsg("Selecione uma categoria válida.");
      return;
    }

    const payload: TransactionRequest = {
      description: description.trim(),
      amount: numAmount,
      date,
      type,
      categoryId: targetCategoryId,
      status,
      paymentMethod: paymentMethod.trim() || null,
      notes: notes.trim() || null,
    };

    try {
      if (isEditing && initialData?.id) {
        await updateMutation.mutateAsync({ id: initialData.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error && err.message) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Não foi possível salvar o lançamento. Confira os campos e tente novamente.");
      }
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-card border-input rounded-2xl shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-foreground">
            {isEditing ? "Editar Lançamento" : "Novo Lançamento"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {isEditing
              ? "Atualize as informações cadastrais do lançamento corporativo."
              : "Preencha os dados da receita ou despesa corporativa."}
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
              Descrição / Fornecedor *
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Servidores AWS Cloud Infrastructure"
              className="w-full h-11 sm:h-9 px-3 rounded-lg bg-secondary/40 border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-colors duration-150"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground block">
                Valor (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                className="w-full h-11 sm:h-9 px-3 rounded-lg bg-secondary/40 border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-colors duration-150"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground block">
                Data do Lançamento *
              </label>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="w-full h-11 sm:h-9 px-3 rounded-lg bg-secondary/40 border border-input text-xs text-foreground flex items-center justify-between focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-colors duration-150 cursor-pointer"
                  >
                    <span>{formatDateDisplay(date) || "Selecione a data"}</span>
                    <CalendarIcon data-icon="inline-end" className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-popover border-input rounded-lg shadow-xl z-50" align="start">
                  <div className="p-3 space-y-2">
                    <Calendar
                      mode="single"
                      selected={date ? new Date(date + "T12:00:00") : undefined}
                      onSelect={(selectedDate) => {
                        if (selectedDate) {
                          setDate(getLocalDateString(selectedDate));
                          setIsCalendarOpen(false);
                        }
                      }}
                      autoFocus
                    />
                    <div className="flex items-center justify-between pt-2 border-t border-border px-1 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setDate("");
                          setIsCalendarOpen(false);
                        }}
                        className="text-accent hover:underline font-medium cursor-pointer"
                      >
                        Limpar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDate(getLocalDateString());
                          setIsCalendarOpen(false);
                        }}
                        className="text-accent hover:underline font-medium cursor-pointer"
                      >
                        Hoje
                      </button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground block">
                Tipo *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TransactionType)}
                className="w-full h-11 sm:h-9 px-3 rounded-lg bg-secondary/40 border border-input text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-colors duration-150 cursor-pointer"
              >
                <option value="EXPENSE" className="bg-popover text-foreground">Despesa (-)</option>
                <option value="INCOME" className="bg-popover text-foreground">Receita (+)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground block">
                Categoria *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(Number(e.target.value))}
                className="w-full h-11 sm:h-9 px-3 rounded-lg bg-secondary/40 border border-input text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-colors duration-150 cursor-pointer"
              >
                {categories.length === 0 ? (
                  <option value="" className="bg-popover text-foreground">Carregando categorias...</option>
                ) : (
                  categories.map((cat) => (
                    <option key={cat.id} value={cat.id} className="bg-popover text-foreground">
                      {cat.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground block">
                Status *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TransactionStatus)}
                className="w-full h-11 sm:h-9 px-3 rounded-lg bg-secondary/40 border border-input text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-colors duration-150 cursor-pointer"
              >
                <option value="COMPLETED" className="bg-popover text-foreground">Concluído</option>
                <option value="PENDING" className="bg-popover text-foreground">Pendente</option>
                <option value="CANCELED" className="bg-popover text-foreground">Cancelado</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground block">
                Forma de Pagamento
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full h-11 sm:h-9 px-3 rounded-lg bg-secondary/40 border border-input text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-colors duration-150 cursor-pointer"
              >
                <option value="Transferência TED" className="bg-popover text-foreground">Transferência TED</option>
                <option value="Boleto Bancário" className="bg-popover text-foreground">Boleto Bancário</option>
                <option value="Cartão Corporativo" className="bg-popover text-foreground">Cartão Corporativo</option>
                <option value="PIX" className="bg-popover text-foreground">PIX</option>
                <option value="Débito Automático" className="bg-popover text-foreground">Débito Automático</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground block">
              Observações / Detalhes do Contrato
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Fatura referente ao mês de Outubro/2026"
              className="w-full h-11 sm:h-9 px-3 rounded-lg bg-secondary/40 border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-colors duration-150"
            />
          </div>

          <DialogFooter className="sm:justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="min-h-11 sm:min-h-9 px-4 py-2 rounded-lg border border-input bg-secondary text-xs font-medium text-foreground hover:bg-secondary/80 transition-colors duration-150"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="min-h-11 sm:min-h-9 px-4 py-2 rounded-lg bg-accent text-accent-foreground text-xs font-semibold hover:bg-accent/90 transition-colors duration-150"
            >
              {isPending ? "Salvando..." : isEditing ? "Salvar Alterações" : "Criar Lançamento"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
