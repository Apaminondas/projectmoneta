"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  SearchIcon,
  FilterIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  MoreHorizontalIcon,
  ChevronDownIcon,
  PlusIcon,
  PencilIcon,
  Trash2Icon,
  EyeIcon,
  XIcon,
  CheckCircle2Icon,
  ClockIcon,
  XCircleIcon,
  CalendarIcon,
} from "lucide-react";
import {
  useTransactions,
  useDeleteTransaction,
  useCategories,
} from "@/hooks/use-moneta-api";
import { useReferencePeriod } from "@/hooks/use-reference-period";
import {
  adaptTransactionsToDealsList,
  DealTableItem,
  formatCurrency,
} from "@/lib/adapters";
import { Skeleton } from "@/components/ui/skeleton";
import { TransactionModal } from "@/components/dashboard/transaction-modal";
import { DataTablePagination } from "@/components/dashboard/data-table-pagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import type { TransactionRequest } from "@/types/api";

const statusConfig = {
  won: { icon: CheckCircle2Icon, color: "text-success", bg: "bg-success/10", label: "Concluído" },
  pending: { icon: ClockIcon, color: "text-warning", bg: "bg-warning/10", label: "Pendente" },
  lost: { icon: XCircleIcon, color: "text-destructive", bg: "bg-destructive/10", label: "Cancelado" },
};

export function DealsSection() {
  const {
    year,
    startDate,
    endDate,
    last3MonthsStart,
    yearStart,
    yearEnd,
    shortLabel,
  } = useReferencePeriod();
  const [selectedPeriod, setSelectedPeriod] = useState<
    "current_month" | "last_3_months" | "year_to_date" | "all"
  >("current_month");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all"); // all, INCOME, EXPENSE
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Sorting
  const [sortField, setSortField] = useState<"company" | "value" | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  // Modals & Actions
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInitialData, setEditingInitialData] = useState<(Partial<TransactionRequest> & { id?: number }) | null>(null);
  const [detailDeal, setDetailDeal] = useState<DealTableItem | null>(null);
  const [dealToDelete, setDealToDelete] = useState<DealTableItem | null>(null);

  // API hooks
  const periodParams = useMemo(() => {
    if (selectedPeriod === "current_month") return { startDate, endDate };
    if (selectedPeriod === "last_3_months") return { startDate: last3MonthsStart, endDate };
    if (selectedPeriod === "year_to_date") return { startDate: yearStart, endDate: yearEnd };
    return undefined;
  }, [selectedPeriod, startDate, endDate, last3MonthsStart, yearStart, yearEnd]);

  const { data: apiTransactions, isLoading, isError } = useTransactions(periodParams);
  const { data: categories = [] } = useCategories();
  const deleteMutation = useDeleteTransaction();

  const allDeals = useMemo(() => {
    return adaptTransactionsToDealsList(apiTransactions);
  }, [apiTransactions]);

  // Filtering
  const filteredDeals = useMemo(() => {
    return allDeals.filter((deal) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        deal.company.toLowerCase().includes(q) ||
        deal.contact.toLowerCase().includes(q) ||
        deal.email.toLowerCase().includes(q);

      const matchesStatus =
        selectedStatus === "all" || deal.status === selectedStatus;

      const dealType = deal.rawTransaction?.type || (deal.stage === "Receita" ? "INCOME" : "EXPENSE");
      const matchesType =
        selectedType === "all" || dealType === selectedType;

      const dealCategoryName = deal.rawTransaction?.categoryName || deal.contact;
      const matchesCategory =
        selectedCategory === "all" || dealCategoryName === selectedCategory;

      return matchesSearch && matchesStatus && matchesType && matchesCategory;
    });
  }, [allDeals, searchQuery, selectedStatus, selectedType, selectedCategory]);

  // Sorting
  const sortedDeals = useMemo(() => {
    if (!sortField) return filteredDeals;
    return [...filteredDeals].sort((a, b) => {
      if (sortField === "company") {
        const comp = a.company.localeCompare(b.company, "pt-BR");
        return sortOrder === "asc" ? comp : -comp;
      }
      if (sortField === "value") {
        return sortOrder === "asc" ? a.value - b.value : b.value - a.value;
      }
      return 0;
    });
  }, [filteredDeals, sortField, sortOrder]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(sortedDeals.length / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const paginatedDeals = sortedDeals.slice(startIndex, startIndex + pageSize);

  const handleSort = (field: "company" | "value") => {
    if (sortField === field) {
      if (sortOrder === "asc") {
        setSortOrder("desc");
      } else {
        setSortField(null);
        setSortOrder("asc");
      }
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const handleOpenCreate = () => {
    setEditingInitialData(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (deal: DealTableItem) => {
    if (deal.rawTransaction) {
      setEditingInitialData({
        id: deal.rawTransaction.id,
        description: deal.rawTransaction.description,
        amount: deal.rawTransaction.amount,
        date: deal.rawTransaction.date,
        type: deal.rawTransaction.type,
        categoryId: deal.rawTransaction.categoryId,
        status: deal.rawTransaction.status,
        paymentMethod: deal.rawTransaction.paymentMethod,
        notes: deal.rawTransaction.notes,
      });
    } else {
      setEditingInitialData({
        id: Number(deal.id),
        description: deal.company,
        amount: deal.value,
        date: new Date().toISOString().split("T")[0],
        type: deal.stage === "Receita" ? "INCOME" : "EXPENSE",
        status: deal.status === "won" ? "COMPLETED" : deal.status === "lost" ? "CANCELED" : "PENDING",
      });
    }
    setIsModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!dealToDelete) return;
    try {
      await deleteMutation.mutateAsync(Number(dealToDelete.id));
      setDealToDelete(null);
    } catch {
      setDealToDelete(null);
    }
  };

  const hasAdvancedFilters = selectedType !== "all" || selectedCategory !== "all";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-foreground">Lançamentos</h2>
          <p className="text-xs text-muted-foreground mt-0.5 max-w-md">
            Consulte e gerencie lançamentos corporativos • {shortLabel}
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          <div className="flex items-center gap-2 bg-secondary/40 border border-input rounded-lg px-2.5 h-11 sm:h-9 text-xs text-muted-foreground">
            <CalendarIcon className="w-4 h-4 text-accent shrink-0" strokeWidth={1.5} />
            <select
              aria-label="Selecionar período de lançamentos"
              value={selectedPeriod}
              onChange={(e) => {
                setSelectedPeriod(
                  e.target.value as "current_month" | "last_3_months" | "year_to_date" | "all"
                );
                setCurrentPage(1);
              }}
              className="bg-transparent text-foreground text-xs outline-none cursor-pointer h-full"
            >
              <option value="current_month" className="bg-popover text-foreground">
                Mês de Referência ({shortLabel})
              </option>
              <option value="last_3_months" className="bg-popover text-foreground">
                Últimos 3 Meses
              </option>
              <option value="year_to_date" className="bg-popover text-foreground">
                Ano ({year})
              </option>
              <option value="all" className="bg-popover text-foreground">
                Todos os Períodos
              </option>
            </select>
          </div>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="min-h-11 sm:min-h-9 px-3.5 rounded-lg bg-accent text-accent-foreground text-xs font-semibold hover:bg-accent/90 transition-colors duration-150 inline-flex items-center gap-1.5"
          >
            <PlusIcon data-icon="inline-start" className="w-4 h-4 shrink-0" strokeWidth={1.5} />
            <span>Novo Lançamento</span>
          </button>
        </div>
      </div>

      {/* Filters and search */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" strokeWidth={1.5} />
              <input
                id="deals-search-input"
                type="text"
                aria-label="Buscar lançamentos por descrição ou favorecido"
                placeholder="Buscar lançamentos..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-64 h-11 sm:h-9 pl-9 pr-4 rounded-lg bg-secondary/40 border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-colors duration-150"
              />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: "all", label: "Todos" },
                { id: "won", label: "Concluídos" },
                { id: "pending", label: "Pendentes" },
                { id: "lost", label: "Cancelados" },
              ].map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => {
                    setSelectedStatus(filter.id);
                    setCurrentPage(1);
                  }}
                  className={cn(
                    "min-h-11 sm:min-h-9 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors duration-150 cursor-pointer",
                    selectedStatus === filter.id
                      ? "border-accent bg-secondary text-foreground font-semibold ring-1 ring-accent/30"
                      : "border-input bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={cn(
              "min-h-11 sm:min-h-9 flex items-center gap-2 px-3 rounded-lg border text-xs font-medium transition-colors duration-150 cursor-pointer",
              showAdvancedFilters || hasAdvancedFilters
                ? "bg-secondary text-foreground border-accent font-medium ring-1 ring-accent/30"
                : "border-input bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            <FilterIcon data-icon="inline-start" className="w-4 h-4" strokeWidth={1.5} />
            <span>Mais filtros</span>
            {hasAdvancedFilters && (
              <span className="w-1.5 h-1.5 rounded-[1px] bg-accent" />
            )}
            <ChevronDownIcon data-icon="inline-end" className={cn("w-3.5 h-3.5 transition-transform duration-150", showAdvancedFilters && "rotate-180")} strokeWidth={1.5} />
          </button>
        </div>

        {/* Collapsible Advanced Filters */}
        {showAdvancedFilters && (
          <div className="p-3 bg-secondary/30 rounded-lg flex flex-wrap items-center gap-4 animate-in fade-in duration-150 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground font-medium">Tipo:</span>
              <select
                aria-label="Filtrar por tipo de lançamento"
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-11 sm:h-8 px-2.5 rounded-lg bg-popover border border-input text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
              >
                <option value="all">Todos os tipos</option>
                <option value="EXPENSE">Apenas Despesas</option>
                <option value="INCOME">Apenas Receitas</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-muted-foreground font-medium">Categoria:</span>
              <select
                aria-label="Filtrar por categoria"
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-11 sm:h-8 px-2.5 rounded-lg bg-popover border border-input text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
              >
                <option value="all">Todas as categorias</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {hasAdvancedFilters && (
              <button
                type="button"
                onClick={() => {
                  setSelectedType("all");
                  setSelectedCategory("all");
                  setCurrentPage(1);
                }}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/60 rounded-lg transition-colors duration-150 ml-auto min-h-11 sm:min-h-8 px-2.5 py-1"
              >
                <XIcon data-icon="inline-start" className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>Limpar filtros</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left py-2.5 px-3.5 text-xs font-medium text-muted-foreground">
                  <button
                    type="button"
                    onClick={() => handleSort("company")}
                    className="relative py-1 flex items-center gap-1.5 hover:text-foreground transition-colors duration-150 cursor-pointer min-h-10 sm:min-h-0 after:absolute after:-inset-1"
                  >
                    <span>Descrição</span>
                    {sortField === "company" ? (
                      sortOrder === "asc" ? <ArrowUpIcon className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} /> : <ArrowDownIcon className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} />
                    ) : (
                      <ArrowUpDownIcon className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
                    )}
                  </button>
                </th>
                <th className="text-left py-2.5 px-3.5 text-xs font-medium text-muted-foreground">
                  Favorecido / Categoria
                </th>
                <th className="text-right py-2.5 px-3.5 text-xs font-medium text-muted-foreground">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleSort("value")}
                      className="relative py-1 flex items-center justify-end gap-1.5 hover:text-foreground transition-colors duration-150 cursor-pointer min-h-10 sm:min-h-0 after:absolute after:-inset-1"
                    >
                      <span>Valor</span>
                      {sortField === "value" ? (
                        sortOrder === "asc" ? <ArrowUpIcon className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} /> : <ArrowDownIcon className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} />
                      ) : (
                        <ArrowUpDownIcon className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
                      )}
                    </button>
                  </div>
                </th>
                <th className="text-left py-2.5 px-3.5 text-xs font-medium text-muted-foreground">
                  Tipo
                </th>
                <th className="text-left py-2.5 px-3.5 text-xs font-medium text-muted-foreground">
                  Status
                </th>
                <th className="text-left py-2.5 px-3.5 text-xs font-medium text-muted-foreground">
                  Data
                </th>
                <th className="w-12 text-center py-2.5 px-3.5 text-xs font-medium text-muted-foreground">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-4">
                    <div className="space-y-2">
                      {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-10 w-full rounded-lg" />
                      ))}
                    </div>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-destructive">
                    Erro ao carregar lançamentos.
                  </td>
                </tr>
              ) : paginatedDeals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-muted-foreground">
                    Sem dados no período
                  </td>
                </tr>
              ) : (
                paginatedDeals.map((deal) => {
                  const status = statusConfig[deal.status];
                  const StatusIcon = status.icon;

                  return (
                    <tr
                      key={deal.id}
                      onClick={() => setDetailDeal(deal)}
                      className="hover:bg-secondary/40 transition-colors duration-150 cursor-pointer"
                    >
                      <td className="py-3 px-3.5 min-w-[260px]">
                        <span className="text-sm font-medium text-foreground line-clamp-2" title={deal.company}>{deal.company}</span>
                      </td>
                      <td className="py-3 px-3.5 min-w-[200px]">
                        <p className="text-sm text-foreground line-clamp-2" title={deal.contact}>{deal.contact}</p>
                      </td>
                      <td className="py-3 px-3.5 text-right text-sm font-bold tabular-nums text-foreground">
                        {formatCurrency(deal.value)}
                      </td>
                      <td className="py-3 px-3.5">
                        <span className="px-2.5 py-1 rounded-full border border-border bg-secondary/50 text-xs font-medium text-foreground">
                          {deal.stage}
                        </span>
                      </td>
                      <td className="py-3 px-3.5">
                        <div
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-medium whitespace-nowrap",
                            deal.status === "won" && "bg-success/10 text-success border-success/35",
                            deal.status === "pending" && "bg-warning/10 text-warning border-warning/35",
                            deal.status === "lost" && "bg-destructive/10 text-destructive border-destructive/35"
                          )}
                        >
                          <StatusIcon className="w-3.5 h-3.5" strokeWidth={1.5} />
                          <span>{status.label}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3.5 text-xs text-muted-foreground whitespace-nowrap">
                        {deal.closeDate}
                      </td>
                      <td
                        className="py-3 px-3.5 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              aria-label={`Ações para ${deal.company}`}
                              className="relative w-8 h-8 sm:w-7 sm:h-7 after:absolute after:-inset-2 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            >
                              <MoreHorizontalIcon className="w-4 h-4" strokeWidth={1.5} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 bg-popover border-input rounded-xl shadow-xl">
                            <DropdownMenuItem
                              onClick={() => setDetailDeal(deal)}
                              className="cursor-pointer text-xs"
                            >
                              <EyeIcon strokeWidth={1.5} />
                              <span>Ver detalhes</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleOpenEdit(deal)}
                              className="cursor-pointer text-xs"
                            >
                              <PencilIcon strokeWidth={1.5} />
                              <span>Editar</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setDealToDelete(deal)}
                              className="cursor-pointer text-xs"
                            >
                              <Trash2Icon strokeWidth={1.5} />
                              <span>Excluir</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <DataTablePagination
          currentPage={validCurrentPage}
          totalPages={totalPages}
          totalItems={sortedDeals.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          pageSizeOptions={[8, 16, 24, 32]}
          itemName="lançamentos"
        />
      </div>

      {/* Transaction Modal (Create & Edit) */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={editingInitialData}
        defaultType="EXPENSE"
      />

      {/* Detail Dialog */}
      <Dialog open={!!detailDeal} onOpenChange={(open) => !open && setDetailDeal(null)}>
        {detailDeal && (
          <DialogContent className="sm:max-w-lg bg-card border-input rounded-2xl shadow-xl p-6 space-y-5">
            <DialogHeader className="text-left space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium",
                    detailDeal.status === "won" && "bg-green-500/10 text-green-500",
                    detailDeal.status === "pending" && "bg-amber-500/10 text-amber-400",
                    detailDeal.status === "lost" && "bg-rose-500/10 text-rose-400"
                  )}
                >
                  {(() => {
                    const StatusIcon = statusConfig[detailDeal.status]?.icon;
                    return StatusIcon ? <StatusIcon className="w-3.5 h-3.5" strokeWidth={1.5} /> : null;
                  })()}
                  <span>{statusConfig[detailDeal.status]?.label}</span>
                </div>
                <span className="text-xs text-muted-foreground">#{detailDeal.id}</span>
              </div>
              <DialogTitle className="text-base font-semibold text-foreground leading-snug">
                {detailDeal.company}
              </DialogTitle>
            </DialogHeader>

            {/* 3 Chips Horizontais */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-secondary/30 text-center text-xs">
              <div className="space-y-0.5">
                <span className="text-muted-foreground block text-[11px]">Valor</span>
                <span className="font-bold text-foreground text-sm tabular-nums">
                  {formatCurrency(detailDeal.value)}
                </span>
              </div>
              <div className="space-y-0.5 border-x border-border/50">
                <span className="text-muted-foreground block text-[11px]">Operação</span>
                <span className={cn("font-semibold text-xs", detailDeal.stage === "Receita" ? "text-green-500" : "text-rose-400")}>
                  {detailDeal.stage === "Receita" ? "Receita" : "Despesa"}
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-muted-foreground block text-[11px]">Data</span>
                <span className="font-medium text-foreground text-xs tabular-nums">
                  {detailDeal.closeDate}
                </span>
              </div>
            </div>

            {/* Metadados Adicionais */}
            <div className="p-3.5 rounded-xl bg-secondary/20 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Favorecido / Fornecedor:</span>
                <span className="font-medium text-foreground">{detailDeal.contact}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Método de Liquidação:</span>
                <span className="font-medium text-foreground">
                  {detailDeal.rawTransaction?.paymentMethod || "PIX Corporativo"}
                </span>
              </div>
            </div>

            {detailDeal.rawTransaction?.notes && (
              <div className="text-xs space-y-1">
                <span className="text-muted-foreground block font-medium">Observações:</span>
                <p className="text-foreground text-xs leading-relaxed bg-secondary/30 p-3 rounded-xl">
                  {detailDeal.rawTransaction.notes}
                </p>
              </div>
            )}

            <DialogFooter className="grid grid-cols-2 gap-3 pt-2">
              <DialogClose asChild>
                <button
                  type="button"
                  className="min-h-10 px-4 py-2 rounded-lg border border-input text-xs font-medium text-foreground hover:bg-secondary/60 transition-colors w-full"
                >
                  Fechar
                </button>
              </DialogClose>
              <button
                type="button"
                onClick={() => {
                  const target = detailDeal;
                  setDetailDeal(null);
                  handleOpenEdit(target);
                }}
                className="min-h-10 px-4 py-2 rounded-lg bg-accent text-accent-foreground text-xs font-semibold hover:bg-accent/90 transition-colors inline-flex items-center justify-center gap-1.5 w-full"
              >
                <PencilIcon className="w-3.5 h-3.5" strokeWidth={2} />
                <span>Editar</span>
              </button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog
        open={!!dealToDelete}
        onOpenChange={(open) => !open && setDealToDelete(null)}
      >
        <AlertDialogContent className="bg-card border-input rounded-2xl sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-semibold text-foreground">
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Tem certeza que deseja excluir o lançamento{" "}
              <strong className="text-foreground font-semibold">
                &quot;{dealToDelete?.company}&quot;
              </strong>{" "}
              no valor de {dealToDelete ? formatCurrency(dealToDelete.value) : ""}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="min-h-11 sm:min-h-9 px-3.5 rounded-lg border border-input bg-secondary text-foreground hover:bg-secondary/80 text-xs">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="min-h-11 sm:min-h-9 px-4 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs font-semibold"
            >
              Excluir Definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
