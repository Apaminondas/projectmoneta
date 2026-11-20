package com.portfolio.finance.transaction.dto;

import com.portfolio.finance.transaction.Transaction;
import com.portfolio.finance.transaction.TransactionStatus;
import com.portfolio.finance.transaction.TransactionType;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TransactionResponse(
        Long id,
        String description,
        BigDecimal amount,
        LocalDate date,
        TransactionType type,
        Long categoryId,
        String categoryName,
        TransactionStatus status,
        String paymentMethod,
        String notes,
        Long accountId,
        String accountName
) {

    public TransactionResponse(Long id, String description, BigDecimal amount, LocalDate date,
                               TransactionType type, Long categoryId, String categoryName) {
        this(id, description, amount, date, type, categoryId, categoryName, TransactionStatus.COMPLETED, null, null, null, null);
    }

    public TransactionResponse(Long id, String description, BigDecimal amount, LocalDate date,
                               TransactionType type, Long categoryId, String categoryName,
                               TransactionStatus status, String paymentMethod, String notes) {
        this(id, description, amount, date, type, categoryId, categoryName, status, paymentMethod, notes, null, null);
    }

    public static TransactionResponse from(Transaction t) {
        Long accId = t.getAccount() != null ? t.getAccount().getId() : null;
        String accName = t.getAccount() != null ? t.getAccount().getName() : null;
        return new TransactionResponse(
                t.getId(),
                t.getDescription(),
                t.getAmount(),
                t.getDate(),
                t.getType(),
                t.getCategory().getId(),
                t.getCategory().getName(),
                t.getStatus(),
                t.getPaymentMethod(),
                t.getNotes(),
                accId,
                accName
        );
    }
}
