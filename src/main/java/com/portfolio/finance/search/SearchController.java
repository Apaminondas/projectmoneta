package com.portfolio.finance.search;

import com.portfolio.finance.exception.ApiError;
import com.portfolio.finance.search.dto.SearchResponseDto;
import com.portfolio.finance.security.AuthenticatedUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/search")
@Tag(name = "Busca Global", description = "Pesquisa unificada em lançamentos, contas e centros de custo")
@ApiResponse(responseCode = "401", description = "Token ausente ou inválido",
        content = @Content(schema = @Schema(implementation = ApiError.class)))
public class SearchController {

    private final SearchService searchService;

    public SearchController(SearchService searchService) {
        this.searchService = searchService;
    }

    @GetMapping
    @Operation(summary = "Realiza busca global unificada com isolamento por usuário (mínimo 2 caracteres)")
    public SearchResponseDto search(
            @RequestParam("q") String query,
            @AuthenticationPrincipal AuthenticatedUser user) {
        return searchService.search(user.id(), query);
    }
}
