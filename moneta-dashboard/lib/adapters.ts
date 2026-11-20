import type {
  MonthlySummaryResponse,
  TransactionResponse,
  CategoryReportResponse,
} from "@/types/api";

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatCompactCurrency(value: number): string {
  return `R$ ${Math.round(value).toLocaleString("pt-BR")}`;
}

export interface KpiMetric {
  title: string;
  subtitle?: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
}

function computeKpiVariation(
  current: number,
  previous: number | null | undefined,
  hasPrevData: boolean,
  invertPolarity = false
): { change: string; changeType: "positive" | "negative" | "neutral" } {
  if (!hasPrevData || previous === null || previous === undefined || previous === 0) {
    return { change: "—", changeType: "neutral" };
  }
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  if (Math.abs(pct) < 0.05) {
    return { change: "0,0%", changeType: "neutral" };
  }
  const sign = pct > 0 ? "+" : "";
  const formatted = `${sign}${pct.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
  const isGood = invertPolarity ? pct < 0 : pct > 0;
  return {
    change: formatted,
    changeType: isGood ? "positive" : "negative",
  };
}

export function adaptMonthlySummaryToKpis(
  summary?: MonthlySummaryResponse | null,
  previousSummary?: MonthlySummaryResponse | null
): KpiMetric[] {
  if (!summary) {
    return [
      { title: "Receita Mensal", value: "R$ 0", change: "—", changeType: "neutral" },
      { title: "Taxa de Poupança", value: "0,0%", change: "—", changeType: "neutral" },
      { title: "Despesas do Mês", value: "R$ 0", change: "—", changeType: "neutral" },
      {
        title: "Resultado do Mês",
        subtitle: "receita − despesa",
        value: "R$ 0",
        change: "—",
        changeType: "neutral",
      },
    ];
  }

  const income = summary.totalIncome || 0;
  const expense = summary.totalExpense || 0;
  const balance = summary.balance ?? income - expense;
  const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;

  const hasPrevData = Boolean(
    previousSummary &&
      ((previousSummary.totalIncome ?? 0) > 0 || (previousSummary.totalExpense ?? 0) > 0)
  );
  const prevIncome = previousSummary?.totalIncome ?? 0;
  const prevExpense = previousSummary?.totalExpense ?? 0;
  const prevBalance = previousSummary ? (previousSummary.balance ?? prevIncome - prevExpense) : 0;
  const prevSavingsRate = prevIncome > 0 ? ((prevIncome - prevExpense) / prevIncome) * 100 : null;

  const incomeVar = computeKpiVariation(income, prevIncome, hasPrevData);
  const savingsVar = computeKpiVariation(savingsRate, prevSavingsRate, hasPrevData);
  const expenseVar = computeKpiVariation(expense, prevExpense, hasPrevData, true);
  const balanceVar = computeKpiVariation(balance, prevBalance, hasPrevData);

  return [
    {
      title: "Receita Mensal",
      value: formatCompactCurrency(income),
      change: incomeVar.change,
      changeType: incomeVar.changeType,
    },
    {
      title: "Taxa de Poupança",
      value: `${savingsRate.toLocaleString("pt-BR", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })}%`,
      change: savingsVar.change,
      changeType: savingsVar.changeType,
    },
    {
      title: "Despesas do Mês",
      value: formatCompactCurrency(expense),
      change: expenseVar.change,
      changeType: expenseVar.changeType,
    },
    {
      title: "Resultado do Mês",
      subtitle: "receita − despesa",
      value: formatCompactCurrency(balance),
      change: balanceVar.change,
      changeType: balanceVar.changeType,
    },
  ];
}

export interface RecentDealItem {
  id?: number;
  company: string;
  value: string;
  status: "won" | "pending" | "lost";
  date: string;
  rep: string;
  rawAmount?: number;
  type?: "INCOME" | "EXPENSE";
  paymentMethod?: string | null;
  notes?: string | null;
  categoryName?: string;
}

export function adaptTransactionsToRecentDeals(
  transactions?: TransactionResponse[] | null
): RecentDealItem[] {
  if (!transactions || transactions.length === 0) {
    return [];
  }

  return [...transactions]
    .sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : b.id - a.id))
    .slice(0, 5)
    .map((t) => {
      let formattedDate = t.date || "—";
      if (t.date && t.date.includes("-")) {
        const [year, month, day] = t.date.split("-");
        formattedDate = `${day}/${month}/${year}`;
      }

      let mappedStatus: "won" | "pending" | "lost" = "won";
      if (t.status === "PENDING") {
        mappedStatus = "pending";
      } else if (t.status === "CANCELED") {
        mappedStatus = "lost";
      } else if (t.status === "COMPLETED") {
        mappedStatus = "won";
      } else {
        mappedStatus = t.type === "INCOME" ? "won" : "pending";
      }

      return {
        id: t.id,
        company: t.description,
        value: formatCurrency(t.amount),
        status: mappedStatus,
        date: formattedDate,
        rep: t.categoryName || (t.type === "INCOME" ? "Receitas" : "Despesas"),
        rawAmount: t.amount,
        type: t.type,
        paymentMethod: t.paymentMethod,
        notes: t.notes,
        categoryName: t.categoryName,
      };
    });
}

export interface DealTableItem {
  id: string;
  company: string;
  contact: string;
  email: string;
  value: number;
  stage: string;
  status: "won" | "pending" | "lost";
  closeDate: string;
  rep: string;
  rawTransaction?: TransactionResponse;
}

export function adaptTransactionsToDealsList(
  transactions?: TransactionResponse[] | null
): DealTableItem[] {
  if (!transactions || transactions.length === 0) {
    return [];
  }

  return transactions.map((t) => {
    let formattedDate = t.date || "—";
    if (t.date && t.date.includes("-")) {
      const [year, month, day] = t.date.split("-");
      formattedDate = `${day}/${month}/${year}`;
    }

    return {
      id: String(t.id),
      company: t.description,
      contact: t.categoryName || "Geral",
      email: "",
      value: t.amount,
      stage: t.type === "INCOME" ? "Receita" : "Despesa",
      status: t.status === "PENDING" ? "pending" : t.status === "CANCELED" ? "lost" : "won",
      closeDate: formattedDate,
      rep: t.type === "INCOME" ? "Crédito" : "Débito",
      rawTransaction: t,
    };
  });
}

export interface PerformerItem {
  id?: number;
  name: string;
  deals: number;
  revenue: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  rank: number;
  totalExpense?: number;
  totalIncome?: number;
  transactions?: RecentDealItem[];
}

export function adaptCategoryReportToPerformers(
  report?: CategoryReportResponse | null,
  transactions?: TransactionResponse[] | null,
  previousTransactions?: TransactionResponse[] | null
): PerformerItem[] {
  if (!report || !report.categories || report.categories.length === 0) {
    return [];
  }

  const sorted = [...report.categories]
    .filter((c) => c.totalExpense > 0)
    .sort((a, b) => b.totalExpense - a.totalExpense);

  if (sorted.length === 0) {
    return [];
  }

  const hasPrev = Boolean(previousTransactions && previousTransactions.length > 0);

  return sorted.slice(0, 5).map((cat, index) => {
    let catTransactions: RecentDealItem[] = [];
    if (transactions && transactions.length > 0) {
      const filtered = transactions.filter(
        (t) =>
          t.categoryId === cat.categoryId ||
          t.categoryName?.trim().toLowerCase() === cat.categoryName?.trim().toLowerCase()
      );
      catTransactions = filtered.map((t) => {
        let formattedDate = t.date || "—";
        if (t.date && t.date.includes("-")) {
          const [year, month, day] = t.date.split("-");
          formattedDate = `${day}/${month}/${year}`;
        }
        return {
          id: t.id,
          company: t.description,
          value: formatCurrency(t.amount),
          status: t.status === "PENDING" ? "pending" : t.status === "CANCELED" ? "lost" : "won",
          date: formattedDate,
          rep: t.categoryName,
          type: t.type,
          paymentMethod: t.paymentMethod,
          notes: t.notes,
        };
      });
    }

    let prevExpense = 0;
    if (hasPrev && previousTransactions) {
      for (const pt of previousTransactions) {
        if (pt.status === "CANCELED" || pt.type !== "EXPENSE") continue;
        if (
          pt.categoryId === cat.categoryId ||
          pt.categoryName?.trim().toLowerCase() === cat.categoryName?.trim().toLowerCase()
        ) {
          prevExpense += pt.amount;
        }
      }
    }

    const variation = computeKpiVariation(cat.totalExpense, prevExpense, hasPrev, true);

    return {
      id: cat.categoryId,
      name: cat.categoryName,
      deals: catTransactions.length,
      revenue: formatCurrency(cat.totalExpense),
      change: variation.change,
      changeType: variation.changeType,
      rank: index + 1,
      totalExpense: cat.totalExpense,
      totalIncome: cat.totalIncome,
      transactions: catTransactions,
    };
  });
}
