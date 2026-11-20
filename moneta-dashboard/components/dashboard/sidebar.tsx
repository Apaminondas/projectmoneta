"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { Section } from "@/app/page";
import {
  LayoutDashboardIcon,
  FolderTreeIcon,
  ArrowLeftRightIcon,
  Building2Icon,
  WalletIcon,
  TrendingUpIcon,
  FileSpreadsheetIcon,
  SettingsIcon,
  XIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";

interface SidebarProps {
  activeSection: Section;
  onSectionChange: (section: Section) => void;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
}

const navItems: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Visão Geral", icon: LayoutDashboardIcon },
  { id: "pipeline", label: "Categorias", icon: FolderTreeIcon },
  { id: "deals", label: "Lançamentos", icon: ArrowLeftRightIcon },
  { id: "customers", label: "Contas", icon: Building2Icon },
  { id: "team", label: "Orçamentos", icon: WalletIcon },
  { id: "forecasting", label: "Previsões", icon: TrendingUpIcon },
  { id: "reports", label: "Relatórios", icon: FileSpreadsheetIcon },
  { id: "settings", label: "Ajustes", icon: SettingsIcon },
];

export function Sidebar({
  activeSection,
  onSectionChange,
  collapsed,
  onCollapsedChange,
  mobileOpen = false,
  onMobileOpenChange,
}: SidebarProps) {
  React.useEffect(() => {
    if (!mobileOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onMobileOpenChange?.(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen, onMobileOpenChange]);

  return (
    <>
      {mobileOpen && (
        <div
          aria-hidden="true"
          onClick={() => onMobileOpenChange?.(false)}
          className="fixed inset-0 z-40 bg-black/70 md:hidden"
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 md:z-40 h-screen bg-sidebar border-r border-sidebar-border flex-col",
          mobileOpen ? "flex w-[240px]" : "hidden md:flex",
          collapsed ? "md:w-[64px]" : "md:w-[240px]"
        )}
      >
        {/* Logo */}
        <div className="h-14 flex items-center justify-between px-3 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl border border-border/80 bg-secondary/80 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
              <img src="/moneta-icon-512.png" alt="Moneta" className="w-6 h-6 object-contain" />
            </div>
            <span
              className={cn(
                "font-heading font-semibold text-[16px] tracking-tight text-sidebar-foreground whitespace-nowrap transition-opacity duration-150",
                collapsed && !mobileOpen ? "md:opacity-0 md:w-0 md:overflow-hidden" : "opacity-100 w-auto"
              )}
            >
              Moneta
            </span>
          </div>

          {mobileOpen && (
            <button
              type="button"
              aria-label="Fechar menu de navegação"
              onClick={() => onMobileOpenChange?.(false)}
              className="md:hidden w-11 h-11 flex items-center justify-center rounded-lg text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors duration-150"
            >
              <XIcon className="w-5 h-5" strokeWidth={1.5} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav aria-label="Navegação principal" className="flex-1 px-2 py-3 space-y-1 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            const isCollapsedDesktop = collapsed && !mobileOpen;

            return (
              <button
                key={item.id}
                type="button"
                aria-current={isActive ? "page" : undefined}
                aria-label={isCollapsedDesktop ? item.label : undefined}
                title={isCollapsedDesktop ? item.label : undefined}
                onClick={() => onSectionChange(item.id)}
                className={cn(
                  "w-full min-h-11 md:min-h-10 flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm transition-colors duration-150 relative",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-foreground font-medium"
                    : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50 font-normal"
                )}
              >
                {/* Active 2px terminal bar */}
                <span
                  className={cn(
                    "absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 bg-accent transition-opacity duration-150",
                    isActive ? "opacity-100" : "opacity-0"
                  )}
                />
                <Icon
                  strokeWidth={1.5}
                  className={cn(
                    "w-5 h-5 shrink-0 transition-colors duration-150",
                    isActive ? "text-accent" : "text-muted-foreground"
                  )}
                />
                <span
                  className={cn(
                    "whitespace-nowrap transition-opacity duration-150",
                    isCollapsedDesktop ? "md:opacity-0 md:w-0 md:overflow-hidden" : "opacity-100"
                  )}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Collapse button (desktop) */}
        <div className="hidden md:block p-2 border-t border-sidebar-border">
          <button
            type="button"
            aria-label={collapsed ? "Expandir barra lateral" : "Recolher barra lateral"}
            onClick={() => onCollapsedChange(!collapsed)}
            className="w-full min-h-9 flex items-center justify-center gap-2 px-2.5 py-2 rounded-lg text-[13px] text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors duration-150"
          >
            {collapsed ? (
              <ChevronRightIcon className="w-4 h-4" strokeWidth={1.5} />
            ) : (
              <>
                <ChevronLeftIcon className="w-4 h-4" strokeWidth={1.5} />
                <span>Recolher</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
