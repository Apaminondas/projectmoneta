package com.portfolio.finance.account.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ContactRequest(
        @NotBlank(message = "O nome do contato é obrigatório")
        @Size(max = 150, message = "O nome não pode exceder 150 caracteres")
        String name,

        @Email(message = "E-mail inválido")
        @Size(max = 150, message = "O e-mail não pode exceder 150 caracteres")
        String email,

        @Pattern(
                regexp = "^$|^\\+?[0-9\\s()\\-]{8,25}$",
                message = "Formato de telefone inválido"
        )
        @Size(max = 50, message = "O telefone não pode exceder 50 caracteres")
        String phone
) {
}
