package com.portfolio.finance.exception;

/**
 * Valor inválido de entrada detectado na camada de serviço. Mapeada para HTTP 400.
 */
public class InvalidValueException extends RuntimeException {

    private final String field;

    public InvalidValueException(String field, String message) {
        super(message);
        this.field = field;
    }

    public String getField() {
        return field;
    }
}
