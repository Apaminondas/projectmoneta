package com.portfolio.finance.security;

/**
 * Principal autenticado colocado no SecurityContext a partir do JWT.
 */
public record AuthenticatedUser(Long id, String email) {

    public AuthenticatedUser(Long id) {
        this(id, null);
    }
}
