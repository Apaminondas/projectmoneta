package com.portfolio.finance.account.dto;

import com.portfolio.finance.account.Appointment;

import java.time.LocalDateTime;

public record AppointmentResponse(
        Long id,
        Long accountId,
        String title,
        LocalDateTime scheduledAt,
        String note,
        LocalDateTime createdAt
) {
    public static AppointmentResponse from(Appointment appt) {
        return new AppointmentResponse(
                appt.getId(),
                appt.getAccount().getId(),
                appt.getTitle(),
                appt.getScheduledAt(),
                appt.getNote(),
                appt.getCreatedAt()
        );
    }
}
