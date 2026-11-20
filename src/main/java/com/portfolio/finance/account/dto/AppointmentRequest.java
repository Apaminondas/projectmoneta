package com.portfolio.finance.account.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public record AppointmentRequest(
        @NotBlank(message = "O título do compromisso é obrigatório")
        @Size(max = 200, message = "O título não pode exceder 200 caracteres")
        String title,

        @NotNull(message = "A data e hora do compromisso são obrigatórias")
        LocalDateTime scheduledAt,

        String note
) {
}
