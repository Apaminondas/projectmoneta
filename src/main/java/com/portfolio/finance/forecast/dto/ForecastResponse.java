package com.portfolio.finance.forecast.dto;

import java.util.List;

public record ForecastResponse(
        ForecastKpiDto kpis,
        List<ProjectionMonthDto> projectionChart,
        List<QuarterlyForecastDto> quarterlyForecast,
        List<ScenarioDto> scenarios,
        List<RiskFactorDto> riskFactors,
        String methodology
) {
}
