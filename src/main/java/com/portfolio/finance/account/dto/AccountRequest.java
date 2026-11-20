package com.portfolio.finance.account.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record AccountRequest(
        @NotBlank(message = "O nome da conta é obrigatório")
        @Size(max = 150, message = "O nome não pode exceder 150 caracteres")
        String name,

        @Size(max = 100, message = "O segmento não pode exceder 100 caracteres")
        String segment,

        @NotBlank(message = "O nível (tier) é obrigatório")
        @Size(max = 50, message = "O nível não pode exceder 50 caracteres")
        String tier,

        @Size(max = 100, message = "A cidade não pode exceder 100 caracteres")
        String city,

        @Size(max = 2, message = "A UF deve ter até 2 caracteres")
        String uf,

        @NotNull(message = "O saldo inicial é obrigatório")
        @DecimalMin(value = "0.00", message = "O saldo inicial deve ser maior ou igual a zero")
        BigDecimal openingBalance,

        @Valid
        ContactRequest contact
) {
}
