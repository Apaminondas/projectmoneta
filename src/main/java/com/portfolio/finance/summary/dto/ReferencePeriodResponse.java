package com.portfolio.finance.summary.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Período de referência resolvido para o usuário autenticado")
public record ReferencePeriodResponse(
        @Schema(description = "Ano de referência", example = "2026")
        int year,
        @Schema(description = "Mês de referência (1-12)", example = "10")
        int month
) {
}

