package com.portfolio.finance.forecast.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

public record RiskFactorCreateRequest(
        @NotBlank(message = "O título do risco é obrigatório")
        @Size(max = 200, message = "O título não pode exceder 200 caracteres")
        String title,

        @Size(max = 100, message = "A categoria não pode exceder 100 caracteres")
        String category,

        @NotBlank(message = "A severidade é obrigatória (high, medium, low)")
        String severity,

        @NotNull(message = "O valor estimado em risco é obrigatório")
        @DecimalMin(value = "0.00", message = "O valor deve ser maior ou igual a zero")
        BigDecimal estimatedAmount,

        String description,

        List<String> relatedDeals
) {
}
