package com.portfolio.finance.transaction;

import com.portfolio.finance.exception.ApiError;
import com.portfolio.finance.security.AuthenticatedUser;
import com.portfolio.finance.transaction.dto.TransactionRequest;
import com.portfolio.finance.transaction.dto.TransactionResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/transactions")
@Tag(name = "Lançamentos", description = "Receitas e despesas do usuário autenticado")
@ApiResponse(responseCode = "401", description = "Token ausente ou inválido",
        content = @Content(schema = @Schema(implementation = ApiError.class)))
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @GetMapping
    @Operation(summary = "Lista lançamentos com filtros opcionais por período e categoria")
    public ResponseEntity<List<TransactionResponse>> list(
            @Parameter(description = "Data inicial (inclusive), formato yyyy-MM-dd", example = "2026-10-01")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @Parameter(description = "Data final (inclusive), formato yyyy-MM-dd", example = "2026-10-31")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @Parameter(description = "Id da categoria")
            @RequestParam(required = false) Long categoryId,
            @Parameter(description = "Página (0-based). Usada somente com size")
            @RequestParam(required = false, defaultValue = "0") int page,
            @Parameter(description = "Tamanho da página (máx. 500). Se omitido, retorna todos os lançamentos")
            @RequestParam(required = false) Integer size,
            @AuthenticationPrincipal AuthenticatedUser user) {
        if (size == null) {
            return ResponseEntity.ok(transactionService.list(user.id(), startDate, endDate, categoryId));
        }
        var result = transactionService.listPage(user.id(), startDate, endDate, categoryId, page, size);
        return ResponseEntity.ok()
                .header("X-Total-Count", String.valueOf(result.getTotalElements()))
                .body(result.getContent());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Detalha um lançamento")
    @ApiResponse(responseCode = "404", description = "Lançamento inexistente ou de outro usuário",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public TransactionResponse get(@PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser user) {
        return transactionService.get(id, user.id());
    }

    @PostMapping
    @Operation(summary = "Lança uma receita (INCOME) ou despesa (EXPENSE)")
    @ApiResponse(responseCode = "201", description = "Lançamento criado")
    @ApiResponse(responseCode = "400", description = "Dados inválidos (ex.: valor negativo ou zero)",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "Categoria inexistente ou de outro usuário",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "422", description = "Despesa com data futura",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public ResponseEntity<TransactionResponse> create(@Valid @RequestBody TransactionRequest request,
                                                      @AuthenticationPrincipal AuthenticatedUser user) {
        TransactionResponse created = transactionService.create(request, user.id());
        URI location = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}")
                .buildAndExpand(created.id()).toUri();
        return ResponseEntity.created(location).body(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualiza um lançamento")
    @ApiResponse(responseCode = "400", description = "Dados inválidos (ex.: valor negativo ou zero)",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "Lançamento ou categoria inexistente ou de outro usuário",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "422", description = "Despesa com data futura",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public TransactionResponse update(@PathVariable Long id, @Valid @RequestBody TransactionRequest request,
                                      @AuthenticationPrincipal AuthenticatedUser user) {
        return transactionService.update(id, request, user.id());
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Remove um lançamento")
    @ApiResponse(responseCode = "204", description = "Lançamento removido")
    @ApiResponse(responseCode = "404", description = "Lançamento inexistente ou de outro usuário",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser user) {
        transactionService.delete(id, user.id());
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}
