package com.portfolio.finance.report.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

public record SavingsRateEvolutionDto(
        String month,
        @JsonInclude(JsonInclude.Include.ALWAYS)
        Double rate
) {
}
