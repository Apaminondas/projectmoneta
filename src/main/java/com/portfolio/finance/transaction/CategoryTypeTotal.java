package com.portfolio.finance.transaction;

import java.math.BigDecimal;

/**
 * Projeção interna: soma dos lançamentos de uma categoria para um tipo.
 */
public record CategoryTypeTotal(Long categoryId, String categoryName, TransactionType type, BigDecimal total) {
}
