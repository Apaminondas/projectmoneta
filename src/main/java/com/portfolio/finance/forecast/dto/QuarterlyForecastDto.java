package com.portfolio.finance.forecast.dto;

import java.math.BigDecimal;

public record QuarterlyForecastDto(
        String quarter,
        BigDecimal committed,
        BigDecimal bestCase,
        BigDecimal pipeline
) {
}
