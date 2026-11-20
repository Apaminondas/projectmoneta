package com.portfolio.finance.forecast.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.util.Map;

/**
 * KPIs consolidados de previsões financeiras.
 *
 * @param forecastT2          previsão de despesas para o trimestre T2 (3 meses)
 * @param forecastT2Ceiling   teto orçamentário para o trimestre T2 (3 meses)
 * @param accuracyPct         percentual de aderência ao teto mensal
 * @param balanceCoverage     cobertura de saldo expressa em MESES (saldo atual ÷ média mensal de despesas
 *                            dos até 3 meses encerrados no período de referência); {@code null} se não houver despesas
 * @param openExpensesAmount  montante de despesas em aberto (PENDING ou futuras no período)
 * @param openExpensesCount   quantidade de despesas em aberto
 * @param formulas            descrição textual das fórmulas aplicadas
 */
public record ForecastKpiDto(
        BigDecimal forecastT2,
        BigDecimal forecastT2Ceiling,
        Integer accuracyPct,
        @JsonInclude(JsonInclude.Include.ALWAYS)
        @Schema(
                description = "Cobertura de saldo expressa em meses (saldo atual ÷ média mensal de despesas dos até 3 meses encerrados no período de referência). Retorna null quando a média é zero ou não há despesas.",
                example = "3.2",
                nullable = true
        )
        BigDecimal balanceCoverage,
        BigDecimal openExpensesAmount,
        Long openExpensesCount,
        Map<String, String> formulas
) {
}
