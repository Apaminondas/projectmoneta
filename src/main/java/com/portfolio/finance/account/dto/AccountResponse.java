package com.portfolio.finance.account.dto;

import com.portfolio.finance.account.Account;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record AccountResponse(
        Long id,
        String name,
        String segment,
        String tier,
        String city,
        String uf,
        BigDecimal openingBalance,
        ContactDto contact,
        BigDecimal movement,
        Long transactionCount,
        String lastOperationDate,
        Integer regularityPct,
        LocalDateTime archivedAt
) {
    public static AccountResponse from(Account account, BigDecimal movement, Long transactionCount,
                                       String lastOperationDate, Integer regularityPct) {
        return new AccountResponse(
                account.getId(),
                account.getName(),
                account.getSegment(),
                account.getTier(),
                account.getCity(),
                account.getUf(),
                account.getOpeningBalance(),
                ContactDto.from(account.getPrimaryContact()),
                movement != null ? movement : BigDecimal.ZERO,
                transactionCount != null ? transactionCount : 0L,
                lastOperationDate != null ? lastOperationDate : "Sem operações",
                regularityPct != null ? regularityPct : 90,
                account.getArchivedAt()
        );
    }
}
