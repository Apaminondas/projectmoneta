package com.portfolio.finance.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

/**
 * Bloqueia operações de escrita (POST, PUT, PATCH, DELETE) diretamente na API para a conta de demonstração
 * quando app.demo.read-only=true, evitando bypass do modo readonly mesmo fora do BFF.
 */
@Component
public class DemoReadOnlyFilter extends OncePerRequestFilter {

    private static final Set<String> MUTATING_METHODS = Set.of("POST", "PUT", "PATCH", "DELETE");

    private final ObjectMapper objectMapper;
    private final boolean readOnly;
    private final String demoEmail;

    public DemoReadOnlyFilter(ObjectMapper objectMapper,
                              @Value("${app.demo.read-only:false}") boolean readOnly,
                              @Value("${app.demo.email:}") String demoEmail) {
        this.objectMapper = objectMapper;
        this.readOnly = readOnly;
        this.demoEmail = demoEmail == null ? "" : demoEmail.trim();
    }

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        if (!readOnly) {
            return true;
        }
        String method = request.getMethod().toUpperCase();
        if (!MUTATING_METHODS.contains(method)) {
            return true;
        }
        String path = request.getRequestURI();
        if (!path.startsWith("/api/")) {
            return true;
        }
        return path.equals("/api/auth/login") || path.equals("/api/auth/logout");
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain chain) throws ServletException, IOException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof AuthenticatedUser user) {
            boolean matchesDemoAccount = demoEmail.isEmpty()
                    || user.email() == null
                    || demoEmail.equalsIgnoreCase(user.email().trim());

            if (matchesDemoAccount) {
                HttpStatus status = HttpStatus.FORBIDDEN;
                Map<String, Object> body = new LinkedHashMap<>();
                body.put("timestamp", Instant.now());
                body.put("status", status.value());
                body.put("error", status.getReasonPhrase());
                body.put("code", "DEMO_READ_ONLY");
                body.put("message", "Modo demonstração: somente leitura");
                body.put("path", request.getRequestURI());

                response.setStatus(status.value());
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.setCharacterEncoding(StandardCharsets.UTF_8.name());
                objectMapper.writeValue(response.getOutputStream(), body);
                return;
            }
        }

        chain.doFilter(request, response);
    }
}

