package com.portfolio.finance.forecast;

import com.portfolio.finance.exception.ApiError;
import com.portfolio.finance.forecast.dto.ForecastResponse;
import com.portfolio.finance.forecast.dto.MitigationPlanDto;
import com.portfolio.finance.forecast.dto.MitigationPlanRequest;
import com.portfolio.finance.forecast.dto.RiskFactorCreateRequest;
import com.portfolio.finance.forecast.dto.RiskFactorDto;
import com.portfolio.finance.security.AuthenticatedUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/forecast")
@Tag(name = "Previsões", description = "Previsões financeiras baseadas em regras determinísticas e fatores de risco")
@ApiResponse(responseCode = "401", description = "Token ausente ou inválido",
        content = @Content(schema = @Schema(implementation = ApiError.class)))
public class ForecastController {

    private final ForecastService forecastService;

    public ForecastController(ForecastService forecastService) {
        this.forecastService = forecastService;
    }

    @GetMapping
    @Operation(
            summary = "Retorna os cálculos de previsão, projeção, cenários e fatores de risco do usuário",
            description = "Inclui cobertura de saldo expressa em meses (null quando não há despesas nos últimos 3 meses encerrados no período de referência). " +
                    "Se year e month não forem informados, utiliza o mês mais recente com lançamentos do usuário."
    )
    public ForecastResponse getForecast(
            @RequestParam(required = false, defaultValue = "T2") String timeframe,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month,
            @AuthenticationPrincipal AuthenticatedUser user) {
        return forecastService.getForecast(user.id(), timeframe, year, month);
    }

    @PostMapping("/risks")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Cadastra um fator de risco financeiro manual")
    @ApiResponse(responseCode = "201", description = "Risco cadastrado com sucesso")
    public RiskFactorDto createManualRisk(
            @Valid @RequestBody RiskFactorCreateRequest request,
            @AuthenticationPrincipal AuthenticatedUser user) {
        return forecastService.createManualRisk(request, user.id());
    }

    @GetMapping("/mitigation/{riskKey}")
    @Operation(summary = "Busca o plano de mitigação e sugestões geradas por regras para um fator de risco")
    public MitigationPlanDto getMitigationPlan(
            @PathVariable String riskKey,
            @AuthenticationPrincipal AuthenticatedUser user) {
        return forecastService.getMitigationPlan(riskKey, user.id());
    }

    @PutMapping("/mitigation/{riskKey}")
    @Operation(summary = "Salva ou atualiza o plano de mitigação de um fator de risco")
    public MitigationPlanDto saveMitigationPlan(
            @PathVariable String riskKey,
            @Valid @RequestBody MitigationPlanRequest request,
            @AuthenticationPrincipal AuthenticatedUser user) {
        return forecastService.saveMitigationPlan(riskKey, request, user.id());
    }
}
