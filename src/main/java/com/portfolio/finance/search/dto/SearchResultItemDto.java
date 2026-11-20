package com.portfolio.finance.search.dto;

public record SearchResultItemDto(
        String id,
        String title,
        String subtitle,
        String category,
        String type,
        String section
) {
}
