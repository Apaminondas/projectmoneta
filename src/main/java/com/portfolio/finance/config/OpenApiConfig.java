package com.portfolio.finance.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import org.springframework.context.annotation.Configuration;

/**
 * Swagger UI com suporte a autenticação Bearer (botão "Authorize").
 */
@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "Moneta API",
                version = "1.0.0",
                description = "API REST Moneta de Gestão Financeira: categorias, receitas, despesas, "
                        + "resumo mensal e relatório por categoria. Autentique-se em /api/auth/login "
                        + "e use o token no botão Authorize."),
        security = @SecurityRequirement(name = OpenApiConfig.BEARER_SCHEME))
@SecurityScheme(
        name = OpenApiConfig.BEARER_SCHEME,
        type = SecuritySchemeType.HTTP,
        scheme = "bearer",
        bearerFormat = "JWT")
public class OpenApiConfig {

    public static final String BEARER_SCHEME = "bearerAuth";
}
