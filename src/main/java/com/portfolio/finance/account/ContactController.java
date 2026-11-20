package com.portfolio.finance.account;

import com.portfolio.finance.account.dto.ContactDto;
import com.portfolio.finance.account.dto.ContactRequest;
import com.portfolio.finance.exception.ApiError;
import com.portfolio.finance.security.AuthenticatedUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/contacts")
@Tag(name = "Contatos", description = "Fonte única de dados de contato (e-mail, telefone) compartilhada entre contas e centros de custo")
@ApiResponse(responseCode = "401", description = "Token ausente ou inválido",
        content = @Content(schema = @Schema(implementation = ApiError.class)))
public class ContactController {

    private final AccountService accountService;

    public ContactController(AccountService accountService) {
        this.accountService = accountService;
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualiza os dados de um contato compartilhado")
    @ApiResponse(responseCode = "200", description = "Contato atualizado")
    @ApiResponse(responseCode = "404", description = "Contato inexistente ou de outro usuário",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public ContactDto update(
            @PathVariable Long id,
            @Valid @RequestBody ContactRequest request,
            @AuthenticationPrincipal AuthenticatedUser user) {
        return accountService.updateContact(id, request, user.id());
    }
}
