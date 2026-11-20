package com.portfolio.finance.search.dto;

import java.util.List;

public record SearchResponseDto(
        List<SearchResultItemDto> results,
        int totalCount,
        String query
) {
}
