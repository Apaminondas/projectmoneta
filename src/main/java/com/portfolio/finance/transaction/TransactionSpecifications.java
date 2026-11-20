package com.portfolio.finance.transaction;

import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;

/**
 * Filtros combináveis para a listagem de lançamentos.
 */
public final class TransactionSpecifications {

    private TransactionSpecifications() {
    }

    public static Specification<Transaction> belongsTo(Long userId) {
        return (root, query, cb) -> cb.equal(root.get("user").get("id"), userId);
    }

    public static Specification<Transaction> dateFrom(LocalDate start) {
        return (root, query, cb) -> start == null ? null
                : cb.greaterThanOrEqualTo(root.<LocalDate>get("date"), start);
    }

    public static Specification<Transaction> dateUntil(LocalDate end) {
        return (root, query, cb) -> end == null ? null
                : cb.lessThanOrEqualTo(root.<LocalDate>get("date"), end);
    }

    public static Specification<Transaction> inCategory(Long categoryId) {
        return (root, query, cb) -> categoryId == null ? null
                : cb.equal(root.get("category").get("id"), categoryId);
    }
}
