package com.portfolio.finance.report.dto;

import java.math.BigDecimal;
import java.util.List;

public record ReportDashboardDto(
        BigDecimal monthlyIncome,
        BigDecimal monthlyExpense,
        BigDecimal monthlyBalance,
        double savingsRate,
        BigDecimal totalSpent,
        BigDecimal totalCeiling,
        List<IncomeSourceDto> revenueSources,
        List<SavingsRateEvolutionDto> savingsRateEvolution
) {
}
