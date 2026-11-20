package com.portfolio.finance.auth;

import com.portfolio.finance.auth.dto.LoginRequest;
import com.portfolio.finance.auth.dto.RegisterRequest;
import com.portfolio.finance.auth.dto.TokenResponse;
import com.portfolio.finance.exception.ApiError;
import com.portfolio.finance.exception.ForbiddenOperationException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Autenticação", description = "Cadastro e login (endpoints públicos)")
@SecurityRequirements // remove o requisito Bearer global destes endpoints
public class AuthController {

    private final AuthService authService;
    private final boolean registrationEnabled;

    public AuthController(AuthService authService,
                          @Value("${app.security.registration-enabled:true}") boolean registrationEnabled) {
        this.authService = authService;
        this.registrationEnabled = registrationEnabled;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Cadastra um novo usuário e retorna o token JWT")
    @ApiResponse(responseCode = "201", description = "Usuário criado")
    @ApiResponse(responseCode = "400", description = "Dados inválidos",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "403", description = "Cadastro desabilitado neste ambiente",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "409", description = "E-mail já cadastrado",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public TokenResponse register(@Valid @RequestBody RegisterRequest request) {
        if (!registrationEnabled) {
            throw new ForbiddenOperationException("Cadastro público desabilitado neste ambiente.");
        }
        return authService.register(request);
    }

    @PostMapping("/login")
    @Operation(summary = "Autentica o usuário e retorna o token JWT")
    @ApiResponse(responseCode = "200", description = "Autenticado")
    @ApiResponse(responseCode = "401", description = "E-mail ou senha inválidos",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public TokenResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/logout")
    @Operation(summary = "Encerra a sessão do usuário")
    @ApiResponse(responseCode = "200", description = "Sessão encerrada com sucesso")
    public java.util.Map<String, String> logout() {
        return java.util.Map.of("message", "Logout realizado com sucesso");
    }
}

