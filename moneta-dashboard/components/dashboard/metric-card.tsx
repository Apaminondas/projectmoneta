"use client";

import { cn } from "@/lib/utils";
import { TrendingUpIcon, TrendingDownIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  subtitle?: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  comparisonLabel?: string;
  icon: LucideIcon;
  delay?: number;
}

export function MetricCard({
  title,
  subtitle,
  value,
  change,
  changeType,
  comparisonLabel = "vs. mês anterior",
  icon: Icon,
}: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 flex flex-col justify-between gap-4 shadow-xs hover:border-foreground/15 hover:bg-secondary/10 transition-colors duration-150">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className="block text-sm font-medium text-muted-foreground truncate">
            {title}
          </span>
          {subtitle && (
            <span className="block text-xs text-muted-foreground/80 truncate mt-0.5">
              {subtitle}
            </span>
          )}
        </div>
        <div className="w-8 h-8 rounded-xl bg-secondary/60 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground tabular-nums">
          {value}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-medium tabular-nums",
              changeType === "positive" && "text-green-600 dark:text-green-500",
              changeType === "negative" && "text-rose-600 dark:text-rose-500",
              changeType === "neutral" && "text-muted-foreground"
            )}
          >
            {changeType === "positive" && <TrendingUpIcon className="w-3.5 h-3.5" strokeWidth={2} />}
            {changeType === "negative" && <TrendingDownIcon className="w-3.5 h-3.5" strokeWidth={2} />}
            <span>{change}</span>
          </span>
          <span className="text-muted-foreground">{comparisonLabel}</span>
        </div>
      </div>
    </div>
  );
}
