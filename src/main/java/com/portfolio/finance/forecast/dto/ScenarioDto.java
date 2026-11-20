package com.portfolio.finance.forecast.dto;

import java.math.BigDecimal;

public record ScenarioDto(
        String name,
        Integer probability,
        BigDecimal revenue,
        String color
) {
}
