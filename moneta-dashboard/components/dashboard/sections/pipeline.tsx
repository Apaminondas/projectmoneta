"use client";

import { useState, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  PlusIcon,
  MoreHorizontalIcon,
  ClockIcon,
  Building2Icon,
  CalendarIcon,
  FolderPlusIcon,
  Trash2Icon,
  EditIcon,
  EyeIcon,
  MoveRightIcon,
  SearchIcon,
  XIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { TransactionModal } from "@/components/dashboard/transaction-modal";
import { CategoryModal } from "@/components/dashboard/category-modal";
import { DataTablePagination } from "@/components/dashboard/data-table-pagination";
import {
  useCategories,
  useTransactions,
  useUpdateTransaction,
  useDeleteTransaction,
} from "@/hooks/use-moneta-api";
import { useReferencePeriod } from "@/hooks/use-reference-period";
import type { TransactionResponse } from "@/types/api";

type PeriodFilter = "current_month" | "last_3_months" | "year_to_date" | "all";

export function PipelineSection() {
  const {
    year,
    startDate,
    endDate,
    last3MonthsStart,
    yearStart,
    yearEnd,
    shortLabel,
  } = useReferencePeriod();

  const periodOptions = useMemo<
    Array<{ id: PeriodFilter; label: string; start?: string; end?: string }>
  >(
    () => [
      {
        id: "current_month",
        label: `Mês de Referência (${shortLabel})`,
        start: startDate,
        end: endDate,
      },
      {
        id: "last_3_months",
        label: "Últimos 3 Meses",
        start: last3MonthsStart,
        end: endDate,
      },
      {
        id: "year_to_date",
        label: `Ano (${year})`,
        start: yearStart,
        end: yearEnd,
      },
      { id: "all", label: "Todos os Períodos" },
    ],
    [shortLabel, startDate, endDate, last3MonthsStart, year, yearStart, yearEnd]
  );

  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>("current_month");
  const [searchQuery, setSearchQuery] = useState("");
  const [focusedCategoryId, setFocusedCategoryId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;
  const stageRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Estados de modais
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);
  const [editingTransaction, setEditingTransaction] = useState<TransactionResponse | null>(null);

  // Modal de Detalhes
  const [detailTransaction, setDetailTransaction] = useState<TransactionResponse | null>(null);

  // AlertDialog de Exclusão
  const [deletingTxId, setDeletingTxId] = useState<number | null>(null);

  // Feedback de erro / aviso
  const [alertError, setAlertError] = useState<string | null>(null);

  // Queries e Mutations
  const activePeriodConfig = periodOptions.find((p) => p.id === selectedPeriod);
  const { data: categories = [], isLoading: isLoadingCategories } = useCategories();
  const { data: transactions = [], isLoading: isLoadingTransactions } = useTransactions({
    startDate: activePeriodConfig?.start,
    endDate: activePeriodConfig?.end,
  });

  const updateMutation = useUpdateTransaction();
  const deleteMutation = useDeleteTransaction();

  // Handlers de Lançamento
  const handleOpenCreate = (catId?: number) => {
    setEditingTransaction(null);
    setSelectedCategoryId(catId);
    setIsTxModalOpen(true);
  };

  const handleOpenEdit = (tx: TransactionResponse) => {
    setEditingTransaction(tx);
    setSelectedCategoryId(tx.categoryId);
    setDetailTransaction(null);
    setIsTxModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingTxId) return;
    try {
      await deleteMutation.mutateAsync(deletingTxId);
      if (detailTransaction?.id === deletingTxId) {
        setDetailTransaction(null);
      }
      setDeletingTxId(null);
    } catch {
      setAlertError("Não foi possível excluir o lançamento.");
    }
  };

  // Drag and Drop
  const handleDragStart = (e: React.DragEvent, txId: number) => {
    e.dataTransfer.setData("text/plain", String(txId));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDropOnStage = async (e: React.DragEvent, targetCategoryId: number) => {
    e.preventDefault();
    const rawId = e.dataTransfer.getData("text/plain");
    const txId = Number(rawId);
    if (!txId) return;

    const tx = transactions.find((t) => t.id === txId);
    if (!tx || tx.categoryId === targetCategoryId) return;

    try {
      await updateMutation.mutateAsync({
        id: tx.id,
        data: {
          description: tx.description,
          amount: tx.amount,
          date: tx.date,
          type: tx.type,
          categoryId: targetCategoryId,
          status: tx.status,
          paymentMethod: tx.paymentMethod,
          notes: tx.notes,
        },
      });
    } catch {
      setAlertError("Não foi possível mover o lançamento.");
    }
  };

  const handleMoveToCategory = async (tx: TransactionResponse, newCatId: number) => {
    if (tx.categoryId === newCatId) return;
    try {
      await updateMutation.mutateAsync({
        id: tx.id,
        data: {
          description: tx.description,
          amount: tx.amount,
          date: tx.date,
          type: tx.type,
          categoryId: newCatId,
          status: tx.status,
          paymentMethod: tx.paymentMethod,
          notes: tx.notes,
        },
      });
      if (detailTransaction?.id === tx.id) {
        const targetCat = categories.find((c) => c.id === newCatId);
        setDetailTransaction({
          ...detailTransaction,
          categoryId: newCatId,
          categoryName: targetCat?.name || detailTransaction.categoryName,
        });
      }
    } catch {
      setAlertError("Não foi possível mover o lançamento.");
    }
  };

  // Agrupamento por Categoria + filtragem rápida (categoria ou lançamento)
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const stages = useMemo(() => {
    return categories.map((cat) => {
      const deals = transactions.filter((t) => t.categoryId === cat.id);
      const categoryMatches =
        normalizedQuery.length > 0 && cat.name.toLowerCase().includes(normalizedQuery);
      const matchingDeals =
        normalizedQuery.length === 0 || categoryMatches
          ? deals
          : deals.filter(
              (t) =>
                t.description.toLowerCase().includes(normalizedQuery) ||
                (t.paymentMethod ?? "").toLowerCase().includes(normalizedQuery)
            );

      const visibleDeals = normalizedQuery.length > 0 ? matchingDeals : deals;
      const isVisibleInSearch =
        normalizedQuery.length === 0 || categoryMatches || matchingDeals.length > 0;

      const totalExpenses = deals
        .filter((t) => t.type === "EXPENSE")
        .reduce((acc, t) => acc + t.amount, 0);
      const totalIncome = deals
        .filter((t) => t.type === "INCOME")
        .reduce((acc, t) => acc + t.amount, 0);

      const ceiling = cat.monthlyCeiling ? Number(cat.monthlyCeiling) : null;
      const usagePct =
        ceiling && ceiling > 0 ? Math.min(Math.round((totalExpenses / ceiling) * 100), 100) : null;

      const isIncome = totalIncome > totalExpenses;
      const totalAmount = isIncome ? totalIncome : totalExpenses;

      return {
        id: cat.id,
        name: cat.name,
        colorToken: cat.colorToken || "chart-1",
        ceiling,
        usagePct,
        deals: visibleDeals,
        totalCategoryDeals: deals.length,
        hasPartialMatch:
          normalizedQuery.length > 0 && !categoryMatches && matchingDeals.length > 0,
        totalExpenses,
        totalIncome,
        isIncome,
        totalAmount,
        isVisibleInSearch,
      };
    });
  }, [categories, transactions, normalizedQuery]);

  const filteredStages = useMemo(
    () => stages.filter((s) => s.isVisibleInSearch),
    [stages]
  );

  // Paginação de 4 em 4 colunas
  const totalStages = filteredStages.length;
  const totalPages = Math.max(1, Math.ceil(totalStages / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedStages = filteredStages.slice(
    (safePage - 1) * itemsPerPage,
    safePage * itemsPerPage
  );
  const visibleStageIds = useMemo(
    () => new Set(paginatedStages.map((s) => s.id)),
    [paginatedStages]
  );

  const handleJumpToCategory = (categoryId: number) => {
    const idx = filteredStages.findIndex((s) => s.id === categoryId);
    if (idx === -1) return;
    const targetPage = Math.floor(idx / itemsPerPage) + 1;
    setCurrentPage(targetPage);
    setFocusedCategoryId(categoryId);
    window.requestAnimationFrame(() => {
      stageRefs.current[categoryId]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
      });
    });
    window.setTimeout(() => {
      setFocusedCategoryId((prev) => (prev === categoryId ? null : prev));
    }, 1600);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header com Descrição, Seletor de Período e Ações */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-foreground">Acompanhamento por Categorias</h2>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">
              Gestão visual de lançamentos corporativos e limites por centro de custo
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Seletor de período */}
            <div className="flex items-center gap-2 bg-secondary/40 border border-input rounded-lg px-2.5 h-11 sm:h-9 text-xs text-muted-foreground">
              <CalendarIcon className="w-4 h-4 text-accent shrink-0" strokeWidth={1.5} />
              <select
                aria-label="Selecionar período de acompanhamento"
                value={selectedPeriod}
                onChange={(e) => {
                  setSelectedPeriod(e.target.value as PeriodFilter);
                  setCurrentPage(1);
                }}
                className="bg-transparent text-foreground text-xs outline-none cursor-pointer h-full"
              >
                {periodOptions.map((opt) => (
                  <option key={opt.id} value={opt.id} className="bg-popover text-foreground">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Nova Categoria */}
            <button
              type="button"
              onClick={() => setIsCatModalOpen(true)}
              className="min-h-11 sm:min-h-9 px-3 rounded-lg border border-input bg-secondary/40 text-foreground text-xs font-medium hover:bg-secondary transition-colors duration-150 inline-flex items-center gap-1.5"
            >
              <FolderPlusIcon data-icon="inline-start" className="w-4 h-4 shrink-0" strokeWidth={1.5} />
              <span>Nova Categoria</span>
            </button>

            {/* Novo Lançamento */}
            <button
              type="button"
              onClick={() => handleOpenCreate(undefined)}
              className="min-h-11 sm:min-h-9 px-3.5 rounded-lg bg-accent text-accent-foreground text-xs font-semibold hover:bg-accent/90 transition-colors duration-150 inline-flex items-center gap-1.5"
            >
              <PlusIcon data-icon="inline-start" className="w-4 h-4 shrink-0" strokeWidth={1.5} />
              <span>Novo Lançamento</span>
            </button>
          </div>
        </div>

        {/* Busca rápida + Paginação acessível no topo + Índice de Categorias */}
        {!isLoadingCategories && !isLoadingTransactions && categories.length > 0 && (
          <div className="space-y-3 bg-card border border-border rounded-2xl p-3 sm:p-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Campo de busca rápida por categoria ou lançamento */}
              <div className="relative flex-1 max-w-md">
                <SearchIcon
                  className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  strokeWidth={1.5}
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  aria-label="Buscar categoria ou descrição do lançamento"
                  placeholder="Buscar categoria ou lançamento..."
                  className="w-full h-11 sm:h-9 pl-9 pr-9 rounded-lg border border-input bg-secondary/40 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setCurrentPage(1);
                    }}
                    aria-label="Limpar busca"
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary"
                  >
                    <XIcon className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </button>
                )}
              </div>

              {/* Paginação direta no topo */}
              <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2 text-xs text-muted-foreground">
                <span className="tabular-nums">
                  {totalStages === 0
                    ? "0 categorias"
                    : `Mostrando ${(safePage - 1) * itemsPerPage + 1}–${Math.min(
                        safePage * itemsPerPage,
                        totalStages
                      )} de ${totalStages} categorias`}
                </span>
                {totalPages > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={safePage <= 1}
                      aria-label="Página anterior de categorias"
                      className="min-h-11 sm:min-h-8 px-2.5 rounded-lg border border-input bg-secondary/40 text-foreground text-xs font-medium hover:bg-secondary disabled:opacity-40 disabled:pointer-events-none inline-flex items-center gap-1"
                    >
                      <ChevronLeftIcon className="w-3.5 h-3.5" strokeWidth={1.5} />
                      <span className="hidden sm:inline">Anterior</span>
                    </button>
                    <span className="px-2 font-mono text-xs tabular-nums text-foreground">
                      {safePage}/{totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={safePage >= totalPages}
                      aria-label="Próxima página de categorias"
                      className="min-h-11 sm:min-h-8 px-2.5 rounded-lg border border-input bg-secondary/40 text-foreground text-xs font-medium hover:bg-secondary disabled:opacity-40 disabled:pointer-events-none inline-flex items-center gap-1"
                    >
                      <span className="hidden sm:inline">Próxima</span>
                      <ChevronRightIcon className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Índice rápido de todas as categorias para salto direto */}
            {filteredStages.length > 0 && (
              <div
                aria-label="Índice rápido de categorias"
                className="flex flex-nowrap overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0 items-center gap-1.5 pt-2.5 border-t border-border/70"
              >
                {filteredStages.map((stage) => {
                  const isVisible = visibleStageIds.has(stage.id);
                  const isFocused = focusedCategoryId === stage.id;
                  const dotTone =
                    (stage.usagePct || 0) >= 100
                      ? "bg-destructive"
                      : (stage.usagePct || 0) >= 80
                      ? "bg-warning"
                      : stage.isIncome
                      ? "bg-success"
                      : "bg-accent";

                  return (
                    <button
                      key={stage.id}
                      type="button"
                      onClick={() => handleJumpToCategory(stage.id)}
                      title={`Ir para ${stage.name} (${stage.deals.length} lançamentos)`}
                      className={cn(
                        "inline-flex shrink-0 items-center gap-1.5 min-h-10 sm:min-h-8 max-w-full rounded-lg border px-2.5 py-1.5 text-xs transition-colors cursor-pointer",
                        isFocused
                          ? "border-accent bg-accent/15 text-foreground font-semibold"
                          : isVisible
                          ? "border-border bg-secondary text-foreground font-medium"
                          : "border-border/70 bg-transparent text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                      )}
                    >
                      <span className={cn("w-2 h-2 rounded-[1px] shrink-0", dotTone)} />
                      <span className="truncate max-w-[165px]">{stage.name}</span>
                      <span className="font-mono text-[11px] tabular-nums opacity-80 shrink-0">
                        {stage.hasPartialMatch
                          ? `${stage.deals.length}/${stage.totalCategoryDeals}`
                          : stage.deals.length}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Alerta de erro transitório se houver */}
        {alertError && (
          <div className="p-3 rounded-lg bg-destructive/15 text-xs text-destructive flex items-center justify-between animate-in fade-in">
            <span>{alertError}</span>
            <button
              type="button"
              onClick={() => setAlertError(null)}
              className="font-bold underline ml-2 hover:opacity-80"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Loading ou Grid das Colunas */}
        {isLoadingCategories || isLoadingTransactions ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="bg-secondary/20 rounded-2xl p-3 min-h-[460px]"
              >
                <div className="h-4 bg-secondary rounded-[1px] w-2/3 mb-4 animate-pulse" />
                <div className="space-y-3">
                  <div className="h-24 bg-secondary/60 rounded-lg animate-pulse" />
                  <div className="h-24 bg-secondary/60 rounded-lg animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredStages.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl shadow-xs p-12 text-center space-y-3">
            <Building2Icon className="w-8 h-8 text-muted-foreground mx-auto" strokeWidth={1.5} />
            <p className="text-sm font-medium text-foreground">
              {normalizedQuery
                ? `Nenhuma categoria ou lançamento encontrado para "${searchQuery.trim()}"`
                : "Nenhuma categoria encontrada"}
            </p>
            <p className="text-[13px] text-muted-foreground">
              {normalizedQuery
                ? "Tente outro termo ou limpe o filtro de busca para exibir todas as categorias."
                : "Cadastre sua primeira categoria para organizar as despesas e receitas."}
            </p>
            {normalizedQuery ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setCurrentPage(1);
                }}
                className="min-h-11 sm:min-h-9 px-4 rounded-lg border border-input bg-secondary text-foreground text-xs font-medium hover:bg-secondary/80 transition-colors duration-150 inline-flex items-center"
              >
                Limpar busca
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsCatModalOpen(true)}
                className="min-h-11 sm:min-h-9 px-4 rounded-lg bg-accent text-accent-foreground text-xs font-semibold hover:bg-accent/90 transition-colors duration-150 inline-flex items-center"
              >
                Cadastrar Categoria
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
            {paginatedStages.map((stage) => (
              <div
                key={stage.id}
                ref={(el) => {
                  stageRefs.current[stage.id] = el;
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add("border-accent");
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove("border-accent");
                }}
                onDrop={(e) => {
                  e.currentTarget.classList.remove("border-accent");
                  handleDropOnStage(e, stage.id);
                }}
                className={cn(
                  "bg-card border rounded-2xl p-3.5 h-[500px] lg:h-[540px] flex flex-col transition-colors duration-200",
                  focusedCategoryId === stage.id
                    ? "border-accent ring-1 ring-accent/40"
                    : "border-border"
                )}
              >
                <div className="shrink-0">
                  {/* Cabeçalho da coluna */}
                  <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-border">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-[1px] bg-accent shrink-0" />
                      <h3
                        title={stage.name}
                        className="text-sm font-semibold text-foreground line-clamp-2"
                      >
                        {stage.name}
                      </h3>
                      <span className="px-1.5 py-0.5 bg-secondary border border-border rounded-lg text-xs font-medium tabular-nums text-muted-foreground shrink-0">
                        {stage.hasPartialMatch
                          ? `${stage.deals.length}/${stage.totalCategoryDeals}`
                          : stage.deals.length}
                      </span>
                    </div>
                    <span className="text-xs font-bold tabular-nums text-foreground text-right shrink-0">
                      R$ {stage.totalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Informação do Teto Mensal se houver */}
                  {stage.ceiling ? (
                    <div className="mb-3 pt-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>Teto: R$ {stage.ceiling.toLocaleString("pt-BR")}</span>
                        <span
                          className={cn(
                            "font-medium tabular-nums",
                            (stage.usagePct || 0) >= 100
                              ? "text-destructive"
                              : (stage.usagePct || 0) >= 80
                              ? "text-warning"
                              : "text-accent"
                          )}
                        >
                          {stage.usagePct}% usado
                        </span>
                      </div>
                      <div className="h-1.5 bg-secondary rounded-[1px] overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-[1px]",
                            (stage.usagePct || 0) >= 100
                              ? "bg-destructive"
                              : (stage.usagePct || 0) >= 80
                              ? "bg-warning"
                              : "bg-accent"
                          )}
                          style={{ width: `${Math.min(stage.usagePct || 0, 100)}%` }}
                        />
                      </div>
                    </div>
                  ) : stage.isIncome ? (
                    <div className="mb-3 pt-1">
                      <div className="flex items-center justify-between text-xs text-success mb-1">
                        <span className="font-medium flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-[1px] bg-success" />
                          Receita Operacional
                        </span>
                        <span className="font-medium">Entradas</span>
                      </div>
                      <div className="h-1.5 bg-secondary rounded-[1px] overflow-hidden">
                        <div className="h-full rounded-[1px] bg-success w-full" />
                      </div>
                    </div>
                  ) : (
                    <div className="mb-2" />
                  )}
                </div>

                {/* Lista de Lançamentos plana (sem cards aninhados) com scroll independente */}
                <div className="flex-1 min-h-0 overflow-y-auto pr-1 divide-y divide-border/70">
                  {stage.deals.length === 0 ? (
                    <div className="py-8 px-4 text-center text-xs text-muted-foreground">
                      Nenhum lançamento no período
                    </div>
                  ) : (
                    stage.deals.map((deal) => (
                      <div
                        key={deal.id}
                        role="button"
                        tabIndex={0}
                        draggable
                        onDragStart={(e) => handleDragStart(e, deal.id)}
                        onClick={() => setDetailTransaction(deal)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setDetailTransaction(deal);
                          }
                        }}
                        className="group text-left py-2.5 px-1.5 cursor-pointer sm:cursor-grab sm:active:cursor-grabbing hover:bg-secondary/45 rounded-lg focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors duration-150 select-none"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <span
                            title={deal.description}
                            className="text-xs font-medium text-foreground line-clamp-2 flex-1 min-w-0"
                          >
                            {deal.description}
                          </span>

                          {/* Menu de ações do lançamento */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                aria-label={`Ações para ${deal.description}`}
                                className="relative w-8 h-8 sm:w-7 sm:h-7 after:absolute after:-inset-2 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors duration-150 shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                              >
                                <MoreHorizontalIcon className="w-4 h-4" strokeWidth={1.5} />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44 bg-popover border-input rounded-xl shadow-xl">
                              <DropdownMenuItem onClick={() => setDetailTransaction(deal)} className="cursor-pointer">
                                <EyeIcon strokeWidth={1.5} />
                                <span>Ver Detalhes</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenEdit(deal)} className="cursor-pointer">
                                <EditIcon className="text-accent" strokeWidth={1.5} />
                                <span>Editar</span>
                              </DropdownMenuItem>

                              {/* Submenu Mover Para */}
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger className="text-xs">
                                  <MoveRightIcon strokeWidth={1.5} />
                                  <span>Mover para...</span>
                                </DropdownMenuSubTrigger>
                                <DropdownMenuPortal>
                                  <DropdownMenuSubContent className="bg-popover border-input rounded-xl shadow-xl">
                                    {categories
                                      .filter((c) => c.id !== deal.categoryId)
                                      .map((c) => (
                                        <DropdownMenuItem
                                          key={c.id}
                                          onClick={() => handleMoveToCategory(deal, c.id)}
                                          className="text-xs cursor-pointer font-sans"
                                        >
                                          {c.name}
                                        </DropdownMenuItem>
                                      ))}
                                  </DropdownMenuSubContent>
                                </DropdownMenuPortal>
                              </DropdownMenuSub>

                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeletingTxId(deal.id)}
                                className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                              >
                                <Trash2Icon strokeWidth={1.5} />
                                <span>Excluir</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Valor e Tipo */}
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="text-sm font-semibold tabular-nums text-foreground">
                            R$ {deal.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <span
                            className={cn(
                              "text-xs font-medium px-2 py-0.5 rounded-full tabular-nums shrink-0",
                              deal.status === "PENDING"
                                ? "bg-warning/15 text-warning"
                                : deal.status === "CANCELED"
                                ? "bg-destructive/15 text-destructive"
                                : "bg-success/15 text-success"
                            )}
                          >
                            {deal.status === "PENDING"
                              ? "Pendente"
                              : deal.status === "CANCELED"
                              ? "Cancelado"
                              : "Concluído"}
                          </span>
                        </div>

                        {/* Data e Pagamento */}
                        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                          <span
                            title={deal.paymentMethod || "Transferência"}
                            className="truncate min-w-0"
                          >
                            {deal.paymentMethod || "Transferência"}
                          </span>
                          <div className="flex items-center gap-1 shrink-0 tabular-nums">
                            <ClockIcon className="w-3 h-3 text-muted-foreground" strokeWidth={1.5} />
                            <span>{deal.date}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Botão de Adicionar item fixo no rodapé da coluna */}
                <div className="shrink-0 pt-3 mt-2 border-t border-border/60">
                  <button
                    type="button"
                    onClick={() => handleOpenCreate(stage.id)}
                    className="w-full min-h-11 sm:min-h-9 flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-input text-xs font-medium text-muted-foreground hover:text-foreground hover:border-accent hover:bg-secondary/40 transition-colors duration-150"
                  >
                    <PlusIcon data-icon="inline-start" className="w-4 h-4" strokeWidth={1.5} />
                    <span>Adicionar item</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Controles de Paginação padronizados */}
        {totalPages > 1 && (
          <DataTablePagination
            currentPage={safePage}
            totalPages={totalPages}
            totalItems={totalStages}
            pageSize={itemsPerPage}
            onPageChange={setCurrentPage}
            itemName="categorias"
            className="border-0 bg-transparent px-0 pt-3"
          />
        )}
      </div>

      {/* Modal Novo / Editar Lançamento */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => {
          setIsTxModalOpen(false);
          setEditingTransaction(null);
        }}
        initialData={editingTransaction}
        defaultCategoryId={selectedCategoryId}
        defaultType="EXPENSE"
      />

      {/* Modal Nova Categoria */}
      <CategoryModal
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
      />

      {/* Modal de Detalhes do Card */}
      {detailTransaction && (
        <Dialog open={Boolean(detailTransaction)} onOpenChange={(open) => !open && setDetailTransaction(null)}>
          <DialogContent className="sm:max-w-lg bg-card border-input rounded-2xl shadow-xl p-6 space-y-5">
            <DialogHeader className="text-left space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium",
                    detailTransaction.status === "COMPLETED" && "bg-green-500/10 text-green-500",
                    detailTransaction.status === "PENDING" && "bg-amber-500/10 text-amber-400",
                    detailTransaction.status === "CANCELED" && "bg-rose-500/10 text-rose-400"
                  )}
                >
                  <span>
                    {detailTransaction.status === "PENDING"
                      ? "Pendente"
                      : detailTransaction.status === "CANCELED"
                      ? "Cancelado"
                      : "Concluído"}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">#{detailTransaction.id}</span>
              </div>
              <DialogTitle className="text-base font-semibold text-foreground leading-snug">
                {detailTransaction.description}
              </DialogTitle>
            </DialogHeader>

            {/* 3 Chips Horizontais */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-secondary/30 text-center text-xs">
              <div className="space-y-0.5">
                <span className="text-muted-foreground block text-[11px]">Valor</span>
                <span className="font-bold text-foreground text-sm tabular-nums">
                  R$ {detailTransaction.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="space-y-0.5 border-x border-border/50">
                <span className="text-muted-foreground block text-[11px]">Operação</span>
                <span className={cn("font-semibold text-xs", detailTransaction.type === "INCOME" ? "text-green-500" : "text-rose-400")}>
                  {detailTransaction.type === "INCOME" ? "Receita" : "Despesa"}
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-muted-foreground block text-[11px]">Data</span>
                <span className="font-medium text-foreground text-xs tabular-nums">
                  {detailTransaction.date}
                </span>
              </div>
            </div>

            {/* Metadados Adicionais */}
            <div className="p-3.5 rounded-xl bg-secondary/20 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Categoria / Centro:</span>
                <span className="font-medium text-foreground">{detailTransaction.categoryName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Método de Liquidação:</span>
                <span className="font-medium text-foreground">
                  {detailTransaction.paymentMethod || "Não informado"}
                </span>
              </div>
            </div>

            {detailTransaction.notes && (
              <div className="text-xs space-y-1 pt-2 border-t border-border/60">
                <span className="text-muted-foreground block font-medium">Observações:</span>
                <p className="text-foreground text-xs leading-relaxed">
                  {detailTransaction.notes}
                </p>
              </div>
            )}

            <DialogFooter className="flex items-center justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingTxId(detailTransaction.id)}
                className="min-h-10 px-3.5 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <Trash2Icon data-icon="inline-start" className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>Excluir</span>
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDetailTransaction(null)}
                  className="min-h-10 px-4 rounded-lg border border-input text-xs font-medium text-foreground hover:bg-secondary/60 transition-colors cursor-pointer"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenEdit(detailTransaction)}
                  className="min-h-10 px-4 rounded-lg bg-accent text-accent-foreground text-xs font-semibold hover:bg-accent/90 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <EditIcon data-icon="inline-start" className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>Editar</span>
                </button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* AlertDialog de Confirmação de Exclusão */}
      <AlertDialog open={Boolean(deletingTxId)} onOpenChange={(open) => !open && setDeletingTxId(null)}>
        <AlertDialogContent className="bg-card border-input rounded-2xl sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-semibold text-foreground">
              Confirmar exclusão de lançamento
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Tem certeza que deseja remover este lançamento? Esta operação excluirá permanentemente o
              registro na API REST e recalculará o saldo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="min-h-11 sm:min-h-9 px-3.5 rounded-lg border border-input bg-secondary text-foreground hover:bg-secondary/80 text-xs">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="min-h-11 sm:min-h-9 px-4 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs font-semibold"
            >
              Excluir Registro
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
