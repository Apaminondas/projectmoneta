package com.portfolio.finance.budget;

import com.portfolio.finance.budget.dto.BudgetResponse;
import com.portfolio.finance.budget.dto.CostCenterDto;
import com.portfolio.finance.budget.dto.CostCenterUpdateRequest;
import com.portfolio.finance.exception.ApiError;
import com.portfolio.finance.security.AuthenticatedUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/budget")
@Tag(name = "Orçamento", description = "Acompanhamento orçamentário por centro de custo e tetos de gastos")
@ApiResponse(responseCode = "401", description = "Token ausente ou inválido",
        content = @Content(schema = @Schema(implementation = ApiError.class)))
public class BudgetController {

    private final BudgetService budgetService;

    public BudgetController(BudgetService budgetService) {
        this.budgetService = budgetService;
    }

    @GetMapping
    @Operation(summary = "Retorna o consolidado orçamentário e a lista de centros de custo com percentual de uso")
    public BudgetResponse getBudget(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @AuthenticationPrincipal AuthenticatedUser user) {
        return budgetService.getBudget(user.id(), startDate, endDate);
    }

    @PutMapping("/{categoryId}")
    @Operation(summary = "Atualiza o perfil de um centro de custo e seu contato responsável unificado")
    @ApiResponse(responseCode = "200", description = "Centro de custo atualizado")
    @ApiResponse(responseCode = "404", description = "Centro de custo inexistente ou de outro usuário",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public CostCenterDto updateCostCenter(
            @PathVariable Long categoryId,
            @Valid @RequestBody CostCenterUpdateRequest request,
            @AuthenticationPrincipal AuthenticatedUser user) {
        return budgetService.updateCostCenter(categoryId, request, user.id());
    }
}
