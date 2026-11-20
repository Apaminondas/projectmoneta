"use client";

import { useMemo } from "react";
import { useReferencePeriodQuery } from "@/hooks/use-moneta-api";

const SHORT_MONTHS_PT = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

const LONG_MONTHS_PT = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export interface ReferencePeriod {
  year: number;
  month: number;
  prevYear: number;
  prevMonth: number;
  startDate: string;
  endDate: string;
  last3MonthsStart: string;
  yearStart: string;
  yearEnd: string;
  shortLabel: string;
  longLabel: string;
  isPartialCurrentMonth: boolean;
  partialMonthBadgeLabel: string | null;
  isReady: boolean;
  isLoading: boolean;
  isError: boolean;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function getSaoPauloDateParts(date: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);

  return {
    year: Number(parts.find((p) => p.type === "year")?.value ?? date.getUTCFullYear()),
    month: Number(parts.find((p) => p.type === "month")?.value ?? date.getUTCMonth() + 1),
    day: Number(parts.find((p) => p.type === "day")?.value ?? date.getUTCDate()),
  };
}

export function useReferencePeriod(): ReferencePeriod {
  const { data, isLoading, isError } = useReferencePeriodQuery();

  return useMemo(() => {
    const { year: nowYear, month: nowMonth, day: nowDay } = getSaoPauloDateParts(new Date());

    const year = data?.year ?? nowYear;
    const month = data?.month ?? nowMonth;

    const prevYear = month === 1 ? year - 1 : year;
    const prevMonth = month === 1 ? 12 : month - 1;

    const startDate = `${year}-${pad2(month)}-01`;
    const monthLastDay = lastDayOfMonth(year, month);
    const endDate = `${year}-${pad2(month)}-${pad2(monthLastDay)}`;

    const isPartialCurrentMonth =
      year === nowYear && month === nowMonth && nowDay < monthLastDay;
    const partialMonthBadgeLabel = isPartialCurrentMonth
      ? `Mês em andamento (até ${pad2(nowDay)}/${pad2(nowMonth)})`
      : null;

    const threeMonthsAgoDate = new Date(year, month - 3, 1);
    const last3MonthsStart = `${threeMonthsAgoDate.getFullYear()}-${pad2(
      threeMonthsAgoDate.getMonth() + 1
    )}-01`;

    const yearStart = `${year}-01-01`;
    const yearEnd = `${year}-12-31`;

    const monthIdx = Math.max(0, Math.min(11, month - 1));
    const shortLabel = `${SHORT_MONTHS_PT[monthIdx]}/${year}`;
    const longLabel = `${LONG_MONTHS_PT[monthIdx]} de ${year}`;

    return {
      year,
      month,
      prevYear,
      prevMonth,
      startDate,
      endDate,
      last3MonthsStart,
      yearStart,
      yearEnd,
      shortLabel,
      longLabel,
      isPartialCurrentMonth,
      partialMonthBadgeLabel,
      isReady: !isLoading,
      isLoading,
      isError,
    };
  }, [data, isLoading, isError]);
}
