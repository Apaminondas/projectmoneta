package com.portfolio.finance.forecast.dto;

import java.math.BigDecimal;

public record ProjectionMonthDto(
        String month,
        BigDecimal actual,
        BigDecimal forecast,
        BigDecimal target
) {
}
