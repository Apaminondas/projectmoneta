package com.portfolio.finance.notification.dto;

import java.time.LocalDateTime;

public record NotificationDto(
        Long id,
        String title,
        String message,
        String type,
        boolean read,
        String link,
        LocalDateTime createdAt,
        String relativeTime
) {
}
