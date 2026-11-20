package com.portfolio.finance.summary.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record CategoryReportResponse(
        LocalDate startDate,
        LocalDate endDate,
        BigDecimal totalIncome,
        BigDecimal totalExpense,
        List<CategoryTotal> categories
) {

    public record CategoryTotal(
            Long categoryId,
            String categoryName,
            BigDecimal totalIncome,
            BigDecimal totalExpense
    ) {
    }
}
