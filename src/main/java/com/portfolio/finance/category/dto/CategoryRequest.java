package com.portfolio.finance.category.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record CategoryRequest(
        @Schema(example = "Locação Comercial")
        @NotBlank(message = "nome é obrigatório")
        @Size(max = 80, message = "nome deve ter no máximo 80 caracteres")
        String name,

        @Schema(example = "chart-1")
        String colorToken,

        @Schema(example = "5000.00")
        BigDecimal monthlyCeiling,

        @Schema(example = "FIXED")
        String kind
) {
    public CategoryRequest(String name) {
        this(name, "chart-1", null, "VARIABLE");
    }
}
