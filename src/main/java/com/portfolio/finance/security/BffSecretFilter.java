package com.portfolio.finance.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.portfolio.finance.exception.ApiError;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;

/**
 * Exige header interno compartilhado (X-BFF-Secret) nas rotas da API quando habilitado.
 * Em produção (perfil prod), impede chamadas diretas que contornem o BFF e seu controle de acesso.
 */
@Component
public class BffSecretFilter extends OncePerRequestFilter {

    public static final String HEADER_NAME = "X-BFF-Secret";
    private static final int MIN_SECRET_LENGTH = 32;

    private final ObjectMapper objectMapper;
    private final String bffSecret;
    private final boolean required;

    public BffSecretFilter(ObjectMapper objectMapper,
                           @Value("${app.security.bff-secret:}") String bffSecret,
                           @Value("${app.security.bff-secret-required:false}") boolean required) {
        this.objectMapper = objectMapper;
        this.bffSecret = bffSecret == null ? "" : bffSecret.trim();
        this.required = required;
    }

    @PostConstruct
    void validateConfiguration() {
        if (required && bffSecret.length() < MIN_SECRET_LENGTH) {
            throw new IllegalStateException(
                    "BFF_SHARED_SECRET deve estar definido com no mínimo 32 caracteres quando app.security.bff-secret-required=true");
        }
    }

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        if (!required && bffSecret.isEmpty()) {
            return true;
        }
        if (HttpMethod.OPTIONS.matches(request.getMethod())) {
            return true;
        }
        String path = request.getRequestURI();
        return !(path.startsWith("/api/") || path.startsWith("/v3/api-docs") || path.startsWith("/swagger-ui"));
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain chain) throws ServletException, IOException {
        String provided = request.getHeader(HEADER_NAME);
        if (provided == null || !MessageDigest.isEqual(
                bffSecret.getBytes(StandardCharsets.UTF_8),
                provided.getBytes(StandardCharsets.UTF_8))) {
            HttpStatus status = HttpStatus.FORBIDDEN;
            ApiError body = new ApiError(Instant.now(), status.value(), status.getReasonPhrase(),
                    "Acesso direto não autorizado", request.getRequestURI(), null);
            response.setStatus(status.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding(StandardCharsets.UTF_8.name());
            objectMapper.writeValue(response.getOutputStream(), body);
            return;
        }

        chain.doFilter(request, response);
    }
}

