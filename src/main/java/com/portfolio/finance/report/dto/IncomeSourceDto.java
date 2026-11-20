package com.portfolio.finance.report.dto;

import java.math.BigDecimal;

public record IncomeSourceDto(
        String name,
        BigDecimal amount,
        int percentage,
        String color
) {
}
