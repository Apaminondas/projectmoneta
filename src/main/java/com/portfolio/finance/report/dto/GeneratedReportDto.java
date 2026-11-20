package com.portfolio.finance.report.dto;

import java.time.LocalDateTime;

public record GeneratedReportDto(
        Long id,
        String title,
        String reportType,
        String period,
        String fileFormat,
        String status,
        Long fileSizeBytes,
        String formattedSize,
        LocalDateTime createdAt,
        int downloadCount
) {
}
