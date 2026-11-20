package com.portfolio.finance.exception;

/**
 * Conflito de estado/integridade (e-mail já cadastrado, categoria em uso). Mapeada para HTTP 409.
 */
public class ConflictException extends RuntimeException {

    public ConflictException(String message) {
        super(message);
    }
}
