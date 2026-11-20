package com.portfolio.finance.report.dto;

import java.math.BigDecimal;

public record CategoryPdfItem(
        String name,
        BigDecimal totalExpense,
        String formattedTotalExpense,
        double percentage,
        String formattedPercentage
) {
}
