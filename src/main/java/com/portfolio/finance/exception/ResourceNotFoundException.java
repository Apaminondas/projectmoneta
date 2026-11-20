package com.portfolio.finance.exception;

/**
 * Recurso inexistente OU pertencente a outro usuário. Mapeada para HTTP 404,
 * para não revelar a existência de dados de terceiros.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String resource, Long id) {
        super(resource + " com id " + id + " não encontrado(a)");
    }
}
