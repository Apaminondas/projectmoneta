"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  MapPinIcon,
  EditIcon,
  ArchiveIcon,
  ClockIcon,
  SendIcon,
} from "lucide-react";
import {
  useUpdateContact,
  useArchiveAccount,
} from "@/hooks/use-moneta-api";
import type { Account } from "@/types/api";

interface AccountDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: Account | null;
  onEditAccount: (account: Account) => void;
}

export function AccountDetailsModal({
  open,
  onOpenChange,
  account,
  onEditAccount,
}: AccountDetailsModalProps) {
  // Edição rápida de contato
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactSavedMsg, setContactSavedMsg] = useState("");

  const updateContactMutation = useUpdateContact();
  const archiveAccountMutation = useArchiveAccount();

  const syncKey = open && account ? String(account.id) : "";
  const [prevSyncKey, setPrevSyncKey] = useState(syncKey);
  if (syncKey !== prevSyncKey) {
    setPrevSyncKey(syncKey);
    if (account) {
      setContactName(account.contact?.name || "");
      setContactEmail(account.contact?.email || "");
      setContactPhone(account.contact?.phone || "");
      setContactSavedMsg("");
    }
  }

  if (!account) return null;

  const handleSaveContact = async () => {
    if (!account.contact?.id) return;
    try {
      await updateContactMutation.mutateAsync({
        id: account.contact.id,
        data: {
          name: contactName.trim(),
          email: contactEmail.trim() || undefined,
          phone: contactPhone.trim() || undefined,
        },
      });
      setContactSavedMsg("Contato atualizado com sucesso!");
      setTimeout(() => setContactSavedMsg(""), 3000);
    } catch {
      setContactSavedMsg("Não foi possível salvar o contato. Tente novamente.");
    }
  };

  const handleArchive = async () => {
    try {
      await archiveAccountMutation.mutateAsync(account.id);
      onOpenChange(false);
    } catch {
      setContactSavedMsg("Não foi possível concluir a operação.");
    }
  };

  const handleSendEmail = () => {
    if (contactEmail) {
      window.location.href = `mailto:${contactEmail}?subject=Contato%20Financeiro%20-%20${encodeURIComponent(account.name)}`;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-card border-input rounded-2xl shadow-xl text-foreground max-h-[90vh] flex flex-col p-6">
        <DialogHeader className="flex flex-row items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12 bg-secondary">
              <AvatarFallback className="bg-secondary text-foreground font-semibold">
                {account.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-xl font-semibold text-foreground">
                {account.name}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs border-border">
                  {account.tier}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {account.segment || "Segmento não informado"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                onEditAccount(account);
              }}
            >
              <EditIcon data-icon="inline-start" strokeWidth={1.5} />
              Editar
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10">
                  <ArchiveIcon data-icon="inline-start" strokeWidth={1.5} />
                  Arquivar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-card border-border text-foreground">
                <AlertDialogHeader>
                  <AlertDialogTitle>Arquivar esta conta?</AlertDialogTitle>
                  <AlertDialogDescription>
                    A conta &ldquo;{account.name}&rdquo; será arquivada (soft delete). Você poderá restaurá-la
                    ou consultar o histórico a qualquer momento.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleArchive}
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  >
                    Confirmar Arquivamento
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pt-4">
          {/* Métricas Principais */}
          <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-secondary/30 text-center text-xs">
            <div className="space-y-0.5">
              <span className="text-muted-foreground block text-[11px]">Saldo Inicial</span>
              <span className="font-bold text-foreground text-sm tabular-nums">
                R$ {account.openingBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="space-y-0.5 border-x border-border/50">
              <span className="text-muted-foreground block text-[11px]">Movimento Total</span>
              <span className="font-bold text-accent text-sm tabular-nums">
                R$ {account.movement.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="space-y-0.5">
              <span className="text-muted-foreground block text-[11px]">Regularidade</span>
              <span className="font-bold text-warning text-sm tabular-nums">
                {account.regularityPct}%
              </span>
            </div>
          </div>

          {/* Localização & Info */}
          <div className="p-3.5 bg-secondary/20 rounded-2xl space-y-2 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPinIcon className="w-4 h-4 text-foreground shrink-0" strokeWidth={1.5} />
              <span>
                {account.city ? `${account.city}, ${account.uf || "BR"}` : "Localização não cadastrada"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <ClockIcon className="w-4 h-4 text-foreground shrink-0" strokeWidth={1.5} />
              <span>Última Operação: {account.lastOperationDate}</span>
            </div>
          </div>

          {/* Dados de Contato Editáveis (Fonte Única) */}
          <div className="p-3.5 bg-secondary/20 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Contato Responsável
                </h3>
                <p className="text-xs text-muted-foreground">
                  Dados de contato da conta e parceiro corporativo
                </p>
              </div>
              {contactEmail && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSendEmail}
                  className="text-accent hover:bg-accent/10 border-accent/30"
                >
                  <SendIcon data-icon="inline-start" strokeWidth={1.5} />
                  Enviar E-mail
                </Button>
              )}
            </div>

            {contactSavedMsg && (
              <p className="text-xs text-accent font-medium">{contactSavedMsg}</p>
            )}

            <div className="space-y-2 pt-1">
              <div className="space-y-1">
                <Label htmlFor="det-contact-name" className="text-xs">
                  Nome do Responsável
                </Label>
                <Input
                  id="det-contact-name"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Nome do contato"
                  className="w-full h-11 sm:h-9 px-3 rounded-lg bg-secondary/40 border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-colors duration-150"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="det-contact-email" className="text-xs">
                    E-mail
                  </Label>
                  <Input
                    id="det-contact-email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="email@empresa.com"
                    className="w-full h-11 sm:h-9 px-3 rounded-lg bg-secondary/40 border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-colors duration-150"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="det-contact-phone" className="text-xs">
                    Telefone
                  </Label>
                  <Input
                    id="det-contact-phone"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="(11) 98765-4321"
                    className="w-full h-11 sm:h-9 px-3 rounded-lg bg-secondary/40 border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-colors duration-150"
                  />
                </div>
              </div>

              {account.contact?.id && (
                <div className="flex justify-end pt-2">
                  <Button
                    size="sm"
                    onClick={handleSaveContact}
                    disabled={updateContactMutation.isPending}
                    className="bg-accent hover:bg-accent/90 text-accent-foreground"
                  >
                    {updateContactMutation.isPending ? "Salvando..." : "Salvar Contato"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
