package com.portfolio.finance.report.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TransactionPdfItem(
        Long id,
        LocalDate date,
        String formattedDate,
        String description,
        String categoryName,
        String type,
        String typeLabel,
        boolean isIncome,
        BigDecimal amount,
        String formattedAmount
) {
}
