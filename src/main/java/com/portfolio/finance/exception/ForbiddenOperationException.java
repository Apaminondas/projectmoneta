package com.portfolio.finance.exception;

/**
 * Exceção de negócio/segurança mapeada para 403 Forbidden.
 */
public class ForbiddenOperationException extends RuntimeException {

    public ForbiddenOperationException(String message) {
        super(message);
    }
}

