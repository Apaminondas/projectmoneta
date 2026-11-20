package com.portfolio.finance.category.dto;

import com.portfolio.finance.category.Category;
import java.math.BigDecimal;

public record CategoryResponse(
        Long id,
        String name,
        String colorToken,
        BigDecimal monthlyCeiling,
        String kind
) {

    public CategoryResponse(Long id, String name) {
        this(id, name, "chart-1", null, "VARIABLE");
    }

    public static CategoryResponse from(Category category) {
        return new CategoryResponse(
                category.getId(),
                category.getName(),
                category.getColorToken(),
                category.getMonthlyCeiling(),
                category.getKind()
        );
    }
}
