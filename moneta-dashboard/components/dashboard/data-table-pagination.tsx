"use client";

import React from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  MoreHorizontalIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface DataTablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  itemName?: string;
  className?: string;
}

export function DataTablePagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [8, 16, 24, 32],
  itemName = "lançamentos",
  className,
}: DataTablePaginationProps) {
  const safeTotalPages = Math.max(1, totalPages);
  const safeCurrentPage = Math.min(Math.max(1, currentPage), safeTotalPages);

  const startItem = totalItems > 0 ? (safeCurrentPage - 1) * pageSize + 1 : 0;
  const endItem = Math.min(safeCurrentPage * pageSize, totalItems);

  // Smart page windowing with ellipsis
  const getPageNumbers = (): (number | "ellipsis")[] => {
    if (safeTotalPages <= 5) {
      return Array.from({ length: safeTotalPages }, (_, i) => i + 1);
    }

    const pages: (number | "ellipsis")[] = [];

    if (safeCurrentPage <= 3) {
      pages.push(1, 2, 3, 4, "ellipsis", safeTotalPages);
    } else if (safeCurrentPage >= safeTotalPages - 2) {
      pages.push(
        1,
        "ellipsis",
        safeTotalPages - 3,
        safeTotalPages - 2,
        safeTotalPages - 1,
        safeTotalPages
      );
    } else {
      pages.push(
        1,
        "ellipsis",
        safeCurrentPage - 1,
        safeCurrentPage,
        safeCurrentPage + 1,
        "ellipsis",
        safeTotalPages
      );
    }

    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border bg-secondary/20 text-xs font-medium text-muted-foreground",
        className
      )}
    >
      {/* Informações de Contagem e Seletor de Tamanho */}
      <div className="flex items-center gap-3 flex-wrap justify-between w-full sm:w-auto">
        <span>
          Mostrando{" "}
          <span className="font-semibold text-foreground tabular-nums">
            {startItem}
          </span>{" "}
          a{" "}
          <span className="font-semibold text-foreground tabular-nums">
            {endItem}
          </span>{" "}
          de{" "}
          <span className="font-semibold text-foreground tabular-nums">
            {totalItems}
          </span>{" "}
          {itemName}
        </span>

        {onPageSizeChange && pageSizeOptions.length > 0 && (
          <div className="flex items-center gap-1.5 pl-2 sm:border-l sm:border-border">
            <span className="text-muted-foreground text-xs">Exibir:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              aria-label={`${itemName} por página`}
              className="h-8 px-2 rounded-lg bg-secondary/50 border border-input text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt} className="bg-popover text-popover-foreground">
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Controles de Navegação */}
      <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-center sm:justify-end">
        {/* Primeira Página */}
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={safeCurrentPage <= 1}
          aria-label="Ir para a primeira página"
          title="Primeira página"
          className="min-h-11 sm:min-h-8 min-w-11 sm:min-w-8 p-0 rounded-lg border border-input bg-secondary/40 text-foreground hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-150 inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <ChevronsLeftIcon className="w-4 h-4" strokeWidth={1.5} />
        </button>

        {/* Página Anterior */}
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, safeCurrentPage - 1))}
          disabled={safeCurrentPage <= 1}
          aria-label="Ir para a página anterior"
          title="Página anterior"
          className="min-h-11 sm:min-h-8 px-2.5 sm:px-2 rounded-lg border border-input bg-secondary/40 text-foreground hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-150 inline-flex items-center gap-1 justify-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <ChevronLeftIcon className="w-4 h-4" strokeWidth={1.5} />
          <span className="hidden md:inline text-xs">Anterior</span>
        </button>

        {/* Pílulas Numéricas */}
        <div className="flex items-center gap-1">
          {pages.map((p, idx) =>
            p === "ellipsis" ? (
              <span
                key={`ellipsis-${idx}`}
                className="min-h-11 sm:min-h-8 min-w-8 sm:min-w-7 inline-flex items-center justify-center text-muted-foreground select-none"
                aria-hidden="true"
              >
                <MoreHorizontalIcon className="w-3.5 h-3.5" strokeWidth={1.5} />
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                aria-label={`Ir para a página ${p}`}
                aria-current={safeCurrentPage === p ? "page" : undefined}
                className={cn(
                  "min-h-11 sm:min-h-8 min-w-11 sm:min-w-8 px-2 rounded-lg border text-xs font-medium tabular-nums transition-colors duration-150 inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer",
                  safeCurrentPage === p
                    ? "border-accent bg-accent/15 text-accent font-semibold ring-1 ring-accent/30"
                    : "border-input bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                {p}
              </button>
            )
          )}
        </div>

        {/* Próxima Página */}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(safeTotalPages, safeCurrentPage + 1))}
          disabled={safeCurrentPage >= safeTotalPages}
          aria-label="Ir para a próxima página"
          title="Próxima página"
          className="min-h-11 sm:min-h-8 px-2.5 sm:px-2 rounded-lg border border-input bg-secondary/40 text-foreground hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-150 inline-flex items-center gap-1 justify-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <span className="hidden md:inline text-xs">Próxima</span>
          <ChevronRightIcon className="w-4 h-4" strokeWidth={1.5} />
        </button>

        {/* Última Página */}
        <button
          type="button"
          onClick={() => onPageChange(safeTotalPages)}
          disabled={safeCurrentPage >= safeTotalPages}
          aria-label="Ir para a última página"
          title="Última página"
          className="min-h-11 sm:min-h-8 min-w-11 sm:min-w-8 p-0 rounded-lg border border-input bg-secondary/40 text-foreground hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-150 inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <ChevronsRightIcon className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}

