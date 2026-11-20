package com.portfolio.finance.forecast.dto;

import java.time.LocalDate;
import java.util.List;

public record MitigationPlanDto(
        Long id,
        String riskKey,
        String actions,
        String owner,
        LocalDate dueDate,
        String status,
        String ruleReason,
        List<String> ruleSuggestions
) {
}
