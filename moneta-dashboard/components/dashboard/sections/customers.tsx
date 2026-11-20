"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2Icon,
  SearchIcon,
  PlusIcon,
  MapPinIcon,
  MailIcon,
  PhoneIcon,
  DollarSignIcon,
  ExternalLinkIcon,
  StarIcon,
  TrendingUpIcon,
  TrendingDownIcon,
} from "lucide-react";
import { useAccounts, useAccountsSummary } from "@/hooks/use-moneta-api";
import { useReferencePeriod } from "@/hooks/use-reference-period";
import { AccountModal } from "@/components/dashboard/account-modal";
import { AccountBreakdownModal } from "@/components/dashboard/account-breakdown-modal";
import { AccountDetailsModal } from "@/components/dashboard/account-details-modal";
import type { Account } from "@/types/api";

const tierColors: Record<string, string> = {
  Principal: "bg-accent/10 text-accent border-accent/35",
  Secundária: "bg-chart-1/10 text-chart-1 border-chart-1/35",
  Reserva: "bg-secondary text-muted-foreground border-border",
};

export function CustomersSection() {
  const { shortLabel } = useReferencePeriod();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  // Estados dos Modais
  const [isNewAccountModalOpen, setIsNewAccountModalOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<Account | null>(null);
  const [selectedAccountDetails, setSelectedAccountDetails] = useState<Account | null>(null);

  // Estado do Modal de Breakdown dos 4 KPIs
  const [breakdownMetric, setBreakdownMetric] = useState<
    "total" | "balance" | "regularity" | "transactions" | null
  >(null);

  const { data: accounts = [], isLoading: isLoadingAccounts } = useAccounts({
    tier: selectedTier || undefined,
    q: searchQuery || undefined,
  });

  const { data: summary, isLoading: isLoadingSummary } = useAccountsSummary();

  const handleOpenEmail = (e: React.MouseEvent, customer: Account) => {
    e.stopPropagation();
    if (customer.contact?.email) {
      window.location.assign(
        `mailto:${customer.contact.email}?subject=Contato%20Financeiro%20-%20${encodeURIComponent(customer.name)}`
      );
    }
  };

  const handleOpenDetails = (customer: Account) => {
    setSelectedAccountDetails(customer);
  };

  const handleEditFromDetails = (customer: Account) => {
    setAccountToEdit(customer);
    setIsNewAccountModalOpen(true);
  };

  const totalRevenue = summary?.accumulatedBalance ?? 0;
  const avgHealthScore = summary?.regularityIndex ?? 0;
  const activeTransactions = summary?.activeTransactions ?? 0;
  const totalAccounts = summary?.totalAccounts ?? accounts.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-foreground">Contas & Parceiros</h2>
          <p className="text-xs text-muted-foreground mt-0.5 max-w-md">
            Gestão de contas corporativas e contatos • {shortLabel}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setAccountToEdit(null);
            setIsNewAccountModalOpen(true);
          }}
          className="min-h-11 sm:min-h-9 px-3.5 rounded-lg bg-accent text-accent-foreground text-xs font-semibold hover:bg-accent/90 transition-colors duration-150 inline-flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <PlusIcon data-icon="inline-start" className="w-4 h-4 shrink-0" strokeWidth={1.5} />
          <span>Nova Conta</span>
        </button>
      </div>

      {/* Summary Cards Interativos com clique para Breakdown — Grid de Cards Arredondados */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            key: "total" as const,
            label: "Total de Contas",
            value: isLoadingSummary ? "..." : totalAccounts.toString(),
            icon: Building2Icon,
            color: "text-foreground",
          },
          {
            key: "balance" as const,
            label: "Saldo Acumulado",
            value: isLoadingSummary
              ? "..."
              : `R$ ${(totalRevenue / 1000).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}k`,
            icon: DollarSignIcon,
            color: "text-accent",
          },
          {
            key: "regularity" as const,
            label: "Índice de Regularidade",
            value: isLoadingSummary ? "..." : `${avgHealthScore}%`,
            icon: StarIcon,
            color: "text-warning",
          },
          {
            key: "transactions" as const,
            label: "Lançamentos Ativos",
            value: isLoadingSummary ? "..." : activeTransactions.toString(),
            icon: TrendingUpIcon,
            color: "text-chart-1",
          },
        ].map((stat) => (
          <button
            key={stat.label}
            type="button"
            onClick={() => setBreakdownMetric(stat.key)}
            className="w-full text-left bg-card border border-border rounded-2xl p-4 sm:p-5 hover:border-foreground/15 hover:bg-secondary/15 transition-all duration-150 flex flex-col justify-between gap-3 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring shadow-xs"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-sm font-medium text-muted-foreground truncate">
                {stat.label}
              </span>
              <div className="w-8 h-8 rounded-xl bg-secondary/60 flex items-center justify-center shrink-0">
                <stat.icon className={`w-4 h-4 ${stat.color} shrink-0`} strokeWidth={1.5} />
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
                {stat.value}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" strokeWidth={1.5} />
            <input
              id="customers-search-input"
              type="text"
              aria-label="Buscar contas e beneficiários"
              placeholder="Buscar contas e beneficiários..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 h-11 sm:h-9 pl-9 pr-4 rounded-lg bg-secondary/40 border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-colors duration-150"
            />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {["Principal", "Secundária", "Reserva"].map((tier) => (
              <button
                key={tier}
                type="button"
                onClick={() => setSelectedTier(selectedTier === tier ? null : tier)}
                className={cn(
                  "min-h-11 sm:min-h-9 px-3 rounded-lg border text-xs font-medium transition-colors duration-150 cursor-pointer",
                  selectedTier === tier
                    ? "border-accent bg-secondary text-foreground font-semibold ring-1 ring-accent/30"
                    : "border-input bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setAccountToEdit(null);
            setIsNewAccountModalOpen(true);
          }}
          className="min-h-11 sm:min-h-9 px-3.5 rounded-lg bg-accent text-accent-foreground text-xs font-semibold hover:bg-accent/90 transition-colors duration-150 inline-flex items-center gap-1.5 self-start sm:self-auto"
        >
          <PlusIcon data-icon="inline-start" className="w-4 h-4 shrink-0" strokeWidth={1.5} />
          <span>Nova Conta</span>
        </button>
      </div>

      {/* Customer Cards Grid */}
      {isLoadingAccounts ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="border border-border bg-card rounded-2xl shadow-xs p-4">
              <div className="flex items-center gap-3 mb-4">
                <Skeleton className="w-9 h-9 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40 rounded-[1px]" />
                  <Skeleton className="h-3 w-24 rounded-[1px]" />
                </div>
              </div>
              <Skeleton className="h-20 w-full mb-4 rounded-[1px]" />
              <Skeleton className="h-8 w-full rounded-[1px]" />
            </div>
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-2xl bg-card p-6">
          <Building2Icon className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-60" strokeWidth={1.5} />
          <h3 className="text-base font-semibold text-foreground">Nenhuma conta encontrada</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {searchQuery || selectedTier
              ? "Tente ajustar os filtros ou a busca para encontrar registros."
              : "Cadastre sua primeira conta ou beneficiário clicando em Nova Conta."}
          </p>
        </div>
      ) : (
        <div>
          <h2 className="sr-only">Listagem de Contas e Instituições</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {accounts.map((customer) => (
            <div
              key={customer.id}
              role="button"
              tabIndex={0}
              onClick={() => handleOpenDetails(customer)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleOpenDetails(customer);
                }
              }}
              className="text-left border border-border bg-card rounded-2xl p-4 hover:border-input hover:bg-secondary/20 transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring shadow-xs"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl border border-border bg-secondary flex items-center justify-center text-xs font-semibold text-foreground shrink-0">
                    {customer.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-foreground truncate">
                      {customer.name}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">{customer.segment || "Geral"}</p>
                  </div>
                </div>
                <span className={cn("text-xs font-medium px-2.5 py-0.5 rounded-full border tabular-nums shrink-0", tierColors[customer.tier] || tierColors.Principal)}>
                  {customer.tier}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 text-xs">
                <div className="space-y-1.5 text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <MapPinIcon className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                    <span className="truncate">{customer.city ? `${customer.city}, ${customer.uf || "BR"}` : "Brasil"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <MailIcon className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                    <span className="truncate">{customer.contact?.email || "Sem e-mail"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <PhoneIcon className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                    <span>{customer.contact?.phone || "Sem telefone"}</span>
                  </div>
                </div>
                <div className="space-y-1.5 tabular-nums">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Movimento</span>
                    <span className="font-semibold text-foreground text-right">
                      R$ {customer.movement.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Lançamentos</span>
                    <span className="font-semibold text-foreground text-right">{customer.transactionCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Última Operação</span>
                    <span className="text-foreground text-right">{customer.lastOperationDate}</span>
                  </div>
                </div>
              </div>

              {/* Health / Regularity Score */}
              <div className="flex items-center justify-between pt-3 border-t border-border text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <span>Regularidade</span>
                  {customer.regularityPct >= 85 ? (
                    <TrendingUpIcon className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} />
                  ) : (
                    <TrendingDownIcon className="w-3.5 h-3.5 text-destructive" strokeWidth={1.5} />
                  )}
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-20 sm:w-24 h-1.5 bg-secondary rounded-[1px] overflow-hidden">
                    <div
                      className="h-full rounded-[1px]"
                      style={{
                        width: `${customer.regularityPct}%`,
                        backgroundColor:
                          customer.regularityPct >= 80
                            ? "var(--accent)"
                            : customer.regularityPct >= 60
                            ? "var(--warning)"
                            : "var(--destructive)",
                      }}
                    />
                  </div>
                  <span
                    className={cn(
                      "font-semibold tabular-nums w-8 text-right",
                      customer.regularityPct >= 80
                        ? "text-accent"
                        : customer.regularityPct >= 60
                        ? "text-warning"
                        : "text-destructive"
                    )}
                  >
                    {customer.regularityPct}%
                  </span>
                </div>
              </div>

              {/* Quick Actions Reais */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={(e) => handleOpenEmail(e, customer)}
                  disabled={!customer.contact?.email}
                  className="flex-1 min-h-11 sm:min-h-8 inline-flex items-center justify-center gap-1.5 rounded-lg border border-input bg-secondary/40 text-xs text-foreground hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
                >
                  <MailIcon data-icon="inline-start" className="w-3.5 h-3.5 text-muted-foreground shrink-0" strokeWidth={1.5} />
                  <span>E-mail</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenDetails(customer);
                  }}
                  aria-label={`Ver detalhes da conta ${customer.name}`}
                  className="w-11 sm:w-8 h-11 sm:h-8 inline-flex items-center justify-center rounded-lg border border-input bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors duration-150 shrink-0"
                >
                  <ExternalLinkIcon className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          ))}
          </div>
        </div>
      )}

      {/* Modal de Criação / Edição de Conta */}
      <AccountModal
        open={isNewAccountModalOpen}
        onOpenChange={setIsNewAccountModalOpen}
        accountToEdit={accountToEdit}
      />

      {/* Modal de Detalhamento dos 4 KPIs (Fórmula + Breakdown de Contas) */}
      <AccountBreakdownModal
        open={!!breakdownMetric}
        onOpenChange={(open) => !open && setBreakdownMetric(null)}
        metricType={breakdownMetric}
        summary={summary}
        accounts={accounts}
      />

      {/* Modal de Detalhes da Conta (Contato Compartilhado e Arquivamento) */}
      <AccountDetailsModal
        open={!!selectedAccountDetails}
        onOpenChange={(open) => !open && setSelectedAccountDetails(null)}
        account={selectedAccountDetails}
        onEditAccount={handleEditFromDetails}
      />
    </div>
  );
}
