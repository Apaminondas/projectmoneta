package com.portfolio.finance.security;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * Configuração do JWT lida de variáveis de ambiente (JWT_SECRET, JWT_EXPIRATION_MS).
 */
@Validated
@ConfigurationProperties(prefix = "app.jwt")
public record JwtProperties(
        @NotBlank(message = "JWT_SECRET deve ser definido")
        @Size(min = 32, message = "JWT_SECRET deve ter pelo menos 32 caracteres")
        String secret,
        @Min(60000)
        long expirationMs
) {
}
