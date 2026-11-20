package com.portfolio.finance.budget.dto;

import com.portfolio.finance.account.dto.ContactDto;

import java.math.BigDecimal;

public record CostCenterDto(
        Long categoryId,
        String name,
        String kind,
        String colorToken,
        BigDecimal ceiling,
        BigDecimal spent,
        Long count,
        Integer usagePct,
        Integer changePct,
        ContactDto contact
) {
}
