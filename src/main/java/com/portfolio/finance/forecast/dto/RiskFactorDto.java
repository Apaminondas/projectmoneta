package com.portfolio.finance.forecast.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record RiskFactorDto(
        String key,
        Long id,
        String title,
        String category,
        String severity,
        BigDecimal estimatedAmount,
        String description,
        String origin,
        List<String> relatedDeals,
        LocalDate deadline
) {
}
