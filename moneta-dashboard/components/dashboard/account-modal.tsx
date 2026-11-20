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
import { useCreateAccount, useUpdateAccount } from "@/hooks/use-moneta-api";
import type { Account, AccountRequest } from "@/types/api";

interface AccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountToEdit?: Account | null;
}

// Máscara brasileira de telefone: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

export function AccountModal({ open, onOpenChange, accountToEdit }: AccountModalProps) {
  const [name, setName] = useState("");
  const [segment, setSegment] = useState("");
  const [tier, setTier] = useState("Principal");
  const [city, setCity] = useState("");
  const [uf, setUf] = useState("");
  const [openingBalance, setOpeningBalance] = useState("0");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const createAccountMutation = useCreateAccount();
  const updateAccountMutation = useUpdateAccount();

  const syncKey = open ? `open:${accountToEdit?.id ?? "new"}` : "closed";
  const [prevSyncKey, setPrevSyncKey] = useState(syncKey);
  if (syncKey !== prevSyncKey) {
    setPrevSyncKey(syncKey);
    if (accountToEdit) {
      setName(accountToEdit.name);
      setSegment(accountToEdit.segment || "");
      setTier(accountToEdit.tier || "Principal");
      setCity(accountToEdit.city || "");
      setUf(accountToEdit.uf || "");
      setOpeningBalance(String(accountToEdit.openingBalance || 0));
      setContactName(accountToEdit.contact?.name || "");
      setContactEmail(accountToEdit.contact?.email || "");
      setContactPhone(formatPhone(accountToEdit.contact?.phone || ""));
    } else {
      setName("");
      setSegment("");
      setTier("Principal");
      setCity("São Paulo");
      setUf("SP");
      setOpeningBalance("0");
      setContactName("");
      setContactEmail("");
      setContactPhone("");
    }
    setErrorMessage("");
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!name.trim()) {
      setErrorMessage("O nome da conta é obrigatório.");
      return;
    }

    const balanceNum = parseFloat(openingBalance.replace(",", "."));
    if (isNaN(balanceNum) || balanceNum < 0) {
      setErrorMessage("O saldo inicial deve ser um número válido maior ou igual a zero.");
      return;
    }

    if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      setErrorMessage("Por favor, informe um e-mail de contato válido.");
      return;
    }

    const payload: AccountRequest = {
      name: name.trim(),
      segment: segment.trim() || undefined,
      tier,
      city: city.trim() || undefined,
      uf: uf.trim().toUpperCase().slice(0, 2) || undefined,
      openingBalance: balanceNum,
      contact: contactName.trim()
        ? {
            name: contactName.trim(),
            email: contactEmail.trim() || undefined,
            phone: contactPhone.trim() || undefined,
          }
        : undefined,
    };

    try {
      if (accountToEdit) {
        await updateAccountMutation.mutateAsync({ id: accountToEdit.id, data: payload });
      } else {
        await createAccountMutation.mutateAsync(payload);
      }
      onOpenChange(false);
    } catch {
      setErrorMessage("Não foi possível salvar a conta. Confira os dados e tente novamente.");
    }
  };

  const isPending = createAccountMutation.isPending || updateAccountMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-input rounded-2xl shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-foreground">
            {accountToEdit ? "Editar Conta" : "Nova Conta"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {accountToEdit
              ? "Atualize as informações cadastrais da conta corporativa."
              : "Preencha as informações cadastrais da conta corporativa."}
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
              <label htmlFor="acc-name" className="text-xs font-medium text-muted-foreground block">
                Nome da Conta / Empresa *
              </label>
              <input
                id="acc-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Horizonte Tecnologia Ltda"
                className="w-full h-11 sm:h-9 px-3 rounded-lg bg-secondary/40 border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-colors duration-150"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="acc-segment" className="text-xs font-medium text-muted-foreground block">
                Segmento
              </label>
              <input
                id="acc-segment"
                type="text"
                value={segment}
                onChange={(e) => setSegment(e.target.value)}
                placeholder="Ex: SaaS & Tecnologia B2B"
                className="w-full h-11 sm:h-9 px-3 rounded-lg bg-secondary/40 border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-colors duration-150"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="acc-tier" className="text-xs font-medium text-muted-foreground block">
                Nível (Tier) *
              </label>
              <select
                id="acc-tier"
                value={tier}
                onChange={(e) => setTier(e.target.value)}
                className="w-full h-11 sm:h-9 px-3 rounded-lg bg-secondary/40 border border-input text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-colors duration-150 cursor-pointer"
              >
                <option value="Principal" className="bg-popover text-foreground">Principal</option>
                <option value="Secundária" className="bg-popover text-foreground">Secundária</option>
                <option value="Reserva" className="bg-popover text-foreground">Reserva</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="acc-city" className="text-xs font-medium text-muted-foreground block">
                Cidade
              </label>
              <input
                id="acc-city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="São Paulo"
                className="w-full h-11 sm:h-9 px-3 rounded-lg bg-secondary/40 border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-colors duration-150"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="acc-uf" className="text-xs font-medium text-muted-foreground block">
                UF (Estado)
              </label>
              <input
                id="acc-uf"
                type="text"
                value={uf}
                onChange={(e) => setUf(e.target.value.toUpperCase().slice(0, 2))}
                placeholder="SP"
                maxLength={2}
                className="w-full h-11 sm:h-9 px-3 rounded-lg bg-secondary/40 border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-colors duration-150"
              />
            </div>

            <div className="col-span-2 space-y-1.5">
              <label htmlFor="acc-balance" className="text-xs font-medium text-muted-foreground block">
                Saldo Inicial (R$) *
              </label>
              <input
                id="acc-balance"
                type="number"
                step="0.01"
                min="0"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                placeholder="0.00"
                className="w-full h-11 sm:h-9 px-3 rounded-lg bg-secondary/40 border border-input text-sm tabular-nums text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-colors duration-150"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-border/60">
            <h3 className="text-xs font-medium text-muted-foreground mb-3">
              Contato Principal (Unificado)
            </h3>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label htmlFor="acc-contact-name" className="text-xs font-medium text-muted-foreground block">
                  Nome do Responsável / Cargo
                </label>
                <input
                  id="acc-contact-name"
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Ex: Diretoria Financeira"
                  className="w-full h-11 sm:h-9 px-3 rounded-lg bg-secondary/40 border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-colors duration-150"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="acc-contact-email" className="text-xs font-medium text-muted-foreground block">
                    E-mail
                  </label>
                  <input
                    id="acc-contact-email"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="financeiro@empresa.com"
                    className="w-full h-11 sm:h-9 px-3 rounded-lg bg-secondary/40 border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-colors duration-150"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="acc-contact-phone" className="text-xs font-medium text-muted-foreground block">
                    Telefone
                  </label>
                  <input
                    id="acc-contact-phone"
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(formatPhone(e.target.value))}
                    placeholder="(11) 3214-5678"
                    className="w-full h-11 sm:h-9 px-3 rounded-lg bg-secondary/40 border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-colors duration-150"
                  />
                </div>
              </div>
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
              {isPending ? "Salvando..." : accountToEdit ? "Salvar Alterações" : "Criar Conta"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
