package com.portfolio.finance.report.dto;

import jakarta.validation.constraints.Size;

public record CompanyProfileUpdateRequest(
        @Size(max = 150, message = "Nome da empresa deve ter no máximo 150 caracteres")
        String companyName,

        @Size(max = 150, message = "E-mail da empresa deve ter no máximo 150 caracteres")
        String companyEmail,

        @Size(max = 50, message = "Telefone da empresa deve ter no máximo 50 caracteres")
        String companyPhone,

        @Size(max = 255, message = "Texto do rodapé deve ter no máximo 255 caracteres")
        String footerText
) {
}
