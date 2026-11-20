package com.portfolio.finance.report.dto;

import jakarta.validation.constraints.NotBlank;

public record GenerateReportRequest(
        @NotBlank(message = "Título do relatório é obrigatório")
        String title,

        @NotBlank(message = "Tipo de relatório é obrigatório")
        String reportType,

        Integer year,
        Integer month,
        Long categoryId,
        Long accountId
) {
}
