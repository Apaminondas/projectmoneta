package com.portfolio.finance.forecast.dto;

import java.time.LocalDate;

public record MitigationPlanRequest(
        String actions,
        String owner,
        LocalDate dueDate,
        String status
) {
}
