package com.portfolio.finance.account;

import com.portfolio.finance.account.dto.AccountRequest;
import com.portfolio.finance.account.dto.AccountResponse;
import com.portfolio.finance.account.dto.AccountSummaryResponse;
import com.portfolio.finance.account.dto.AppointmentRequest;
import com.portfolio.finance.account.dto.AppointmentResponse;
import com.portfolio.finance.exception.ApiError;
import com.portfolio.finance.security.AuthenticatedUser;
import io.swagger.v3.oas.annotations.Operation;
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
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/accounts")
@Tag(name = "Contas", description = "Gestão de contas financeiras, contrapartes e compromissos")
@ApiResponse(responseCode = "401", description = "Token ausente ou inválido",
        content = @Content(schema = @Schema(implementation = ApiError.class)))
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @GetMapping
    @Operation(summary = "Lista as contas do usuário com filtros opcionais")
    public List<AccountResponse> list(
            @RequestParam(required = false) String tier,
            @RequestParam(required = false) String q,
            @RequestParam(required = false, defaultValue = "false") boolean includeArchived,
            @AuthenticationPrincipal AuthenticatedUser user) {
        return accountService.listAccounts(user.id(), tier, q, includeArchived);
    }

    @GetMapping("/summary")
    @Operation(summary = "KPIs consolidados de contas com breakdown")
    public AccountSummaryResponse summary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @AuthenticationPrincipal AuthenticatedUser user) {
        return accountService.getSummary(user.id(), startDate, endDate);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Detalha uma conta")
    @ApiResponse(responseCode = "404", description = "Conta inexistente ou de outro usuário",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public AccountResponse get(@PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser user) {
        return accountService.getAccount(id, user.id());
    }

    @PostMapping
    @Operation(summary = "Cria uma nova conta")
    @ApiResponse(responseCode = "201", description = "Conta criada")
    @ApiResponse(responseCode = "400", description = "Dados inválidos",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public ResponseEntity<AccountResponse> create(
            @Valid @RequestBody AccountRequest request,
            @AuthenticationPrincipal AuthenticatedUser user) {
        AccountResponse response = accountService.createAccount(request, user.id());
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(response.id())
                .toUri();
        return ResponseEntity.created(location).body(response);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualiza uma conta existente")
    public AccountResponse update(
            @PathVariable Long id,
            @Valid @RequestBody AccountRequest request,
            @AuthenticationPrincipal AuthenticatedUser user) {
        return accountService.updateAccount(id, request, user.id());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Arquiva uma conta (soft delete)")
    @ApiResponse(responseCode = "204", description = "Conta arquivada")
    @ApiResponse(responseCode = "404", description = "Conta inexistente ou de outro usuário",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public void archive(@PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser user) {
        accountService.archiveAccount(id, user.id());
    }

    // --- Compromissos / Agenda ---

    @GetMapping("/{id}/appointments")
    @Operation(summary = "Lista compromissos da agenda de uma conta")
    public List<AppointmentResponse> listAppointments(
            @PathVariable Long id,
            @AuthenticationPrincipal AuthenticatedUser user) {
        return accountService.listAppointments(id, user.id());
    }

    @PostMapping("/{id}/appointments")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Cria um compromisso na agenda da conta")
    public AppointmentResponse createAppointment(
            @PathVariable Long id,
            @Valid @RequestBody AppointmentRequest request,
            @AuthenticationPrincipal AuthenticatedUser user) {
        return accountService.createAppointment(id, request, user.id());
    }

    @PutMapping("/{id}/appointments/{apptId}")
    @Operation(summary = "Atualiza um compromisso")
    public AppointmentResponse updateAppointment(
            @PathVariable Long id,
            @PathVariable Long apptId,
            @Valid @RequestBody AppointmentRequest request,
            @AuthenticationPrincipal AuthenticatedUser user) {
        return accountService.updateAppointment(id, apptId, request, user.id());
    }

    @DeleteMapping("/{id}/appointments/{apptId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Exclui um compromisso")
    public void deleteAppointment(
            @PathVariable Long id,
            @PathVariable Long apptId,
            @AuthenticationPrincipal AuthenticatedUser user) {
        accountService.deleteAppointment(id, apptId, user.id());
    }
}
