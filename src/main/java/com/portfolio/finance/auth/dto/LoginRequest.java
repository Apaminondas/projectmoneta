package com.portfolio.finance.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @Schema(example = "maria@email.com")
        @NotBlank(message = "e-mail é obrigatório")
        String email,

        @Schema(example = "senhaSegura123")
        @NotBlank(message = "senha é obrigatória")
        String password
) {
}
