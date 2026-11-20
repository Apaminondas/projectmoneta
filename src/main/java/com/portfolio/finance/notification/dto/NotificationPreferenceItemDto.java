package com.portfolio.finance.notification.dto;

public record NotificationPreferenceItemDto(
        String id,
        String label,
        String description,
        boolean email,
        boolean push
) {}
