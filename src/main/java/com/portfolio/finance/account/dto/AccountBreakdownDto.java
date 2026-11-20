package com.portfolio.finance.account.dto;

import java.math.BigDecimal;

public record AccountBreakdownDto(
        Long accountId,
        String name,
        BigDecimal value,
        Long transactionCount
) {
}
