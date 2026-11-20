package com.portfolio.finance.budget.dto;

import java.math.BigDecimal;
import java.util.List;

public record BudgetResponse(
        BigDecimal consolidatedSpend,
        Long transactionCount,
        Integer avgCeilingAdherence,
        List<CostCenterDto> costCenters,
        String formula
) {
}
