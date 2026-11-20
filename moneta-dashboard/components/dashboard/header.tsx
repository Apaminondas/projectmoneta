"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { Section } from "@/app/page";
import {
  BellIcon,
  SearchIcon,
  CalendarIcon,
  CheckCheckIcon,
  ExternalLinkIcon,
  SettingsIcon,
  FileTextIcon,
  Building2Icon,
  PieChartIcon,
  Loader2Icon,
  MenuIcon,
  XIcon,
} from "lucide-react";
import {
  useUserProfile,
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useGlobalSearch,
} from "@/hooks/use-moneta-api";
import { useReferencePeriod } from "@/hooks/use-reference-period";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  activeSection: Section;
  onNavigate?: (section: Section) => void;
  onMobileMenuToggle?: () => void;
}

const sectionTitles: Record<Section, string> = {
  overview: "Visão Geral",
  pipeline: "Categorias",
  deals: "Lançamentos",
  customers: "Contas",
  team: "Orçamentos",
  forecasting: "Previsões",
  reports: "Relatórios",
  settings: "Ajustes",
};

export function Header({ activeSection, onNavigate, onMobileMenuToggle }: HeaderProps) {
  // Search state & debounce
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Debounce query by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Notifications state
  const [notifFilter, setNotifFilter] = useState<"all" | "unread">("all");
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Hooks
  const { shortLabel, isPartialCurrentMonth, partialMonthBadgeLabel } = useReferencePeriod();
  const { data: userProfile } = useUserProfile();
  const { data: unreadCountData } = useUnreadNotificationCount();
  const { data: notifications = [], isLoading: isLoadingNotifs } = useNotifications(
    notifFilter === "unread"
  );
  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllMutation = useMarkAllNotificationsAsRead();
  const { data: searchResults, isLoading: isSearching } = useGlobalSearch(debouncedQuery);

  const unreadCount = unreadCountData?.unreadCount ?? 0;

  const initials = userProfile?.name
    ? userProfile.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "FA";

  // Handle outside click for search dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchResultClick = (sectionStr: string) => {
    if (onNavigate && sectionStr in sectionTitles) {
      onNavigate(sectionStr as Section);
    }
    setSearchQuery("");
    setSearchFocused(false);
    setMobileSearchOpen(false);
  };

  const handleNotificationClick = (item: import("@/types/api").NotificationItem) => {
    if (!item.read) {
      markAsReadMutation.mutate(item.id);
    }
    if (item.link && onNavigate && item.link in sectionTitles) {
      onNavigate(item.link as Section);
      setPopoverOpen(false);
    }
  };

  const showSearchResults = searchFocused && debouncedQuery.length >= 2;

  return (
    <header className="h-14 border-b border-border bg-background sticky top-0 z-30 flex items-center justify-between gap-3 px-4 md:px-6">
      <div className={cn("flex items-center gap-3 md:gap-5 min-w-0", mobileSearchOpen && "hidden sm:flex")}>
        <button
          id="mobile-menu-btn"
          type="button"
          aria-label="Abrir menu de navegação"
          onClick={onMobileMenuToggle}
          className="md:hidden w-11 h-11 shrink-0 flex items-center justify-center rounded-lg border border-input bg-secondary/40 text-foreground hover:bg-secondary transition-colors duration-150"
        >
          <MenuIcon className="w-5 h-5" strokeWidth={1.5} />
        </button>

        <h1 className="text-xl font-semibold tracking-tight text-foreground truncate">
          {sectionTitles[activeSection]}
        </h1>

        <div className="hidden lg:flex items-center gap-2 border-l border-border pl-4 text-xs font-medium text-muted-foreground">
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <CalendarIcon className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
          <span>Referência: {shortLabel}</span>
          {isPartialCurrentMonth && partialMonthBadgeLabel && (
            <Badge variant="secondary" className="text-[11px] font-medium">
              {partialMonthBadgeLabel}
            </Badge>
          )}
        </div>
      </div>

      <div className={cn("flex items-center gap-2 md:gap-3 shrink-0", mobileSearchOpen && "w-full sm:w-auto")}>
        {/* Mobile search open button (>= 44px touch target) */}
        {!mobileSearchOpen && (
          <button
            type="button"
            aria-label="Buscar lançamentos e contas"
            onClick={() => {
              setMobileSearchOpen(true);
              setSearchFocused(true);
            }}
            className="sm:hidden w-11 h-11 flex items-center justify-center rounded-lg border border-input bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors duration-150"
          >
            <SearchIcon className="w-5 h-5" strokeWidth={1.5} />
          </button>
        )}

        {/* Global Search with Debounce & Server Aggregation */}
        <div
          ref={searchContainerRef}
          className={cn(
            "relative items-center",
            mobileSearchOpen ? "flex flex-1" : "hidden sm:flex",
            searchFocused ? "sm:w-72 md:w-80" : "sm:w-52 md:w-60"
          )}
        >
          <SearchIcon
            className="absolute left-3 w-4 h-4 text-muted-foreground pointer-events-none"
            strokeWidth={1.5}
          />
          <input
            id="global-search-input"
            type="text"
            aria-label="Buscar lançamentos e contas"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar lançamentos, contas..."
            onFocus={() => setSearchFocused(true)}
            className="w-full h-11 sm:h-9 pl-9 pr-11 sm:pr-9 rounded-lg bg-secondary/40 border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-colors duration-150"
          />
          {(searchQuery || mobileSearchOpen) && (
            <button
              type="button"
              aria-label="Limpar busca"
              onClick={() => {
                setSearchQuery("");
                if (mobileSearchOpen) {
                  setMobileSearchOpen(false);
                  setSearchFocused(false);
                }
              }}
              className="absolute right-0 w-11 h-11 sm:right-1.5 sm:w-7 sm:h-7 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-lg"
            >
              <XIcon className="w-4 h-4" strokeWidth={1.5} />
            </button>
          )}

          {/* Search Dropdown Results */}
          {showSearchResults && (
            <div
              id="search-results-dropdown"
              className="absolute top-full right-0 sm:left-0 mt-1.5 w-[calc(100vw-2rem)] sm:w-96 max-h-96 overflow-y-auto bg-popover border border-input rounded-lg shadow-xl p-1.5 z-50 animate-in fade-in duration-150"
            >
              {isSearching ? (
                <div className="flex items-center justify-center p-6 text-sm text-muted-foreground gap-2">
                  <Loader2Icon className="w-4 h-4 animate-spin text-accent" strokeWidth={1.5} />
                  <span>Pesquisando no servidor...</span>
                </div>
              ) : searchResults && searchResults.results.length > 0 ? (
                <div className="divide-y divide-border">
                  <div className="px-2.5 py-1.5 text-[13px] font-medium text-muted-foreground flex items-center justify-between">
                    <span>Resultados da Busca</span>
                    <span className="tabular-nums">{searchResults.totalCount} itens</span>
                  </div>
                  {searchResults.results.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSearchResultClick(item.section)}
                      className="w-full text-left p-2.5 hover:bg-secondary/60 transition-colors duration-150 flex items-start gap-2.5 group"
                    >
                      <div className="mt-0.5 text-muted-foreground group-hover:text-accent shrink-0">
                        {item.type === "TRANSACTION" ? (
                          <FileTextIcon className="w-4 h-4" strokeWidth={1.5} />
                        ) : item.type === "ACCOUNT" ? (
                          <Building2Icon className="w-4 h-4" strokeWidth={1.5} />
                        ) : (
                          <PieChartIcon className="w-4 h-4" strokeWidth={1.5} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-foreground truncate group-hover:text-accent transition-colors duration-150">
                            {item.title}
                          </p>
                          <Badge variant="outline" className="text-xs px-1.5 py-0 shrink-0">
                            {item.category}
                          </Badge>
                        </div>
                        <p className="text-[13px] text-muted-foreground truncate mt-0.5">
                          {item.subtitle}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  Nenhum resultado encontrado para &quot;{debouncedQuery}&quot;
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notifications Popover */}
        {!mobileSearchOpen && (
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <button
                id="notifications-bell-btn"
                type="button"
                aria-label="Notificações"
                className="relative w-11 h-11 md:w-9 md:h-9 flex items-center justify-center rounded-lg border border-transparent hover:border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors duration-150"
              >
                <BellIcon className="w-5 h-5" strokeWidth={1.5} />
                {unreadCount > 0 && (
                  <span
                    id="notifications-badge"
                    className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-accent text-xs leading-none font-semibold tabular-nums text-accent-foreground rounded-full flex items-center justify-center animate-in zoom-in-75 duration-150"
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              sideOffset={6}
              className="w-[calc(100vw-2rem)] sm:w-[380px] p-0 bg-popover border-input shadow-xl rounded-lg overflow-hidden"
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-secondary/30">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-foreground">Notificações</span>
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {unreadCount} nova{unreadCount > 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => markAllMutation.mutate()}
                  disabled={unreadCount === 0 || markAllMutation.isPending}
                  className="h-8 text-xs text-muted-foreground hover:text-foreground"
                >
                  <CheckCheckIcon data-icon="inline-start" strokeWidth={1.5} />
                  Marcar todas
                </Button>
              </div>

              {/* Filter Tabs */}
              <div className="flex border-b border-border px-4 py-1.5 gap-2 bg-background/50">
                <button
                  type="button"
                  onClick={() => setNotifFilter("all")}
                  className={cn(
                    "px-2.5 py-1 text-xs rounded-lg font-medium transition-colors duration-150",
                    notifFilter === "all"
                      ? "bg-secondary text-foreground border border-border"
                      : "text-muted-foreground hover:text-foreground border border-transparent"
                  )}
                >
                  Todas
                </button>
                <button
                  type="button"
                  onClick={() => setNotifFilter("unread")}
                  className={cn(
                    "px-2.5 py-1 text-xs rounded-lg font-medium tabular-nums transition-colors duration-150",
                    notifFilter === "unread"
                      ? "bg-secondary text-foreground border border-border"
                      : "text-muted-foreground hover:text-foreground border border-transparent"
                  )}
                >
                  Não lidas ({unreadCount})
                </button>
              </div>

              {/* List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-border">
                {isLoadingNotifs ? (
                  <div className="p-8 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                    <Loader2Icon className="w-4 h-4 animate-spin text-accent" strokeWidth={1.5} />
                    Carregando notificações...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    Nenhuma notificação {notifFilter === "unread" ? "não lida" : "no momento"}.
                  </div>
                ) : (
                  notifications.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNotificationClick(item)}
                      className={cn(
                        "w-full p-3.5 text-left transition-colors duration-150 cursor-pointer flex gap-3 relative group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring",
                        !item.read
                          ? "bg-accent/5 hover:bg-accent/10"
                          : "hover:bg-secondary/40"
                      )}
                    >
                      {!item.read && (
                        <span className="w-1.5 h-1.5 rounded-[1px] bg-accent shrink-0 mt-2" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p
                            className={cn(
                              "text-sm truncate",
                              !item.read
                                ? "font-semibold text-foreground"
                                : "font-medium text-muted-foreground"
                            )}
                          >
                            {item.title}
                          </p>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {item.relativeTime}
                          </span>
                        </div>
                        <p className="text-[13px] text-muted-foreground line-clamp-2 leading-relaxed">
                          {item.message}
                        </p>
                        {item.link && (
                          <span className="text-xs text-accent mt-1.5 inline-flex items-center gap-1 font-medium">
                            Ver detalhes <ExternalLinkIcon className="w-4 h-4" strokeWidth={1.5} />
                          </span>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Selo discreto de Modo Demonstração + Avatar do usuário */}
        {!mobileSearchOpen && (
          <div className="flex items-center gap-2">
            <Badge
              id="demo-mode-badge"
              variant="outline"
              className="hidden sm:inline-flex items-center gap-1.5 border-accent/40 bg-accent/10 text-accent text-[11px] font-medium px-2.5 py-0.5 rounded-md"
            >
              Modo demonstração
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  id="user-avatar-btn"
                  type="button"
                  aria-label={
                    userProfile?.name
                      ? `Menu do usuário ${userProfile.name}`
                      : "Menu do perfil do usuário"
                  }
                  title={
                    userProfile?.name
                      ? `${userProfile.name} (${userProfile.email})`
                      : "Perfil do Usuário"
                  }
                  className="w-11 h-11 md:w-9 md:h-9 rounded-lg border border-input bg-secondary hover:border-foreground/40 transition-colors duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-ring flex items-center justify-center"
                >
                  <span className="text-xs font-semibold text-foreground">
                    {initials}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={6} className="w-56 bg-popover border-input shadow-xl">
                <DropdownMenuLabel className="font-normal p-3">
                  <div className="flex flex-col space-y-1">
                    <p className="font-sans text-sm font-semibold leading-none text-foreground">
                      {userProfile?.name ?? "Finance Admin"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground truncate">
                      {userProfile?.email ?? "admin@finance.corp"}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onNavigate?.("settings")}
                  className="cursor-pointer py-2"
                >
                  <SettingsIcon strokeWidth={1.5} />
                  <span>Ajustes & Configurações</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="px-3 py-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Ambiente</span>
                  <Badge
                    variant="outline"
                    className="border-accent/40 bg-accent/10 text-accent text-[10px] font-medium px-2 py-0"
                  >
                    Modo demonstração
                  </Badge>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </header>
  );
}
