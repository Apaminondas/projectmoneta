package com.portfolio.finance.budget.dto;

import com.portfolio.finance.account.dto.ContactRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record CostCenterUpdateRequest(
        @NotBlank(message = "O nome do centro de custo é obrigatório")
        @Size(max = 80, message = "O nome não pode exceder 80 caracteres")
        String name,

        String kind,

        String colorToken,

        @DecimalMin(value = "0.00", message = "O teto deve ser maior ou igual a zero")
        BigDecimal monthlyCeiling,

        @Valid
        ContactRequest contact
) {
}
