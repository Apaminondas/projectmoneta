package com.portfolio.finance.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @Schema(example = "Maria Silva")
        @NotBlank(message = "nome é obrigatório")
        @Size(max = 100, message = "nome deve ter no máximo 100 caracteres")
        String name,

        @Schema(example = "maria@email.com")
        @NotBlank(message = "e-mail é obrigatório")
        @Email(message = "e-mail inválido")
        @Size(max = 150, message = "e-mail deve ter no máximo 150 caracteres")
        String email,

        @Schema(example = "senhaSegura123")
        @NotBlank(message = "senha é obrigatória")
        @Size(min = 8, max = 72, message = "senha deve ter entre 8 e 72 caracteres")
        String password
) {
}
