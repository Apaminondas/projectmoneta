package com.portfolio.finance.account.dto;

import java.math.BigDecimal;
import java.util.List;

public record AccountSummaryResponse(
        Long totalAccounts,
        BigDecimal accumulatedBalance,
        Integer regularityIndex,
        Long activeTransactions,
        List<AccountBreakdownDto> breakdown,
        String formula
) {
}
