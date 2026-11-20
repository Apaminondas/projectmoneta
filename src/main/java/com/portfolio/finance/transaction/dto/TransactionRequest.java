package com.portfolio.finance.transaction.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.portfolio.finance.transaction.TransactionStatus;
import com.portfolio.finance.transaction.TransactionType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TransactionRequest(
        @Schema(example = "Supermercado")
        @NotBlank(message = "descrição é obrigatória")
        @Size(max = 255, message = "descrição deve ter no máximo 255 caracteres")
        @JsonAlias({"descricao", "description"})
        String description,

        @Schema(example = "150.75", description = "Valor do lançamento. Deve ser maior que zero.")
        @NotNull(message = "valor é obrigatório")
        @Positive(message = "valor deve ser maior que zero")
        @Digits(integer = 17, fraction = 2, message = "valor deve ter no máximo 2 casas decimais")
        @JsonAlias({"valor", "amount"})
        BigDecimal amount,

        @Schema(example = "2026-10-01", description = "Despesas não podem ter data futura.")
        @NotNull(message = "data é obrigatória")
        @JsonAlias({"data", "dataHora", "date"})
        LocalDate date,

        @Schema(example = "EXPENSE")
        @NotNull(message = "tipo é obrigatório (INCOME ou EXPENSE)")
        @JsonAlias({"tipo", "type"})
        TransactionType type,

        @Schema(example = "1")
        @NotNull(message = "categoria é obrigatória")
        @JsonAlias({"categoriaId", "categoryId"})
        Long categoryId,

        @Schema(example = "COMPLETED", description = "Status do lançamento (COMPLETED, PENDING, CANCELED). Padrão: COMPLETED")
        TransactionStatus status,

        @Schema(example = "Cartão de Crédito", description = "Método de pagamento (ex.: PIX, Cartão de Crédito, Boleto)")
        @Size(max = 50, message = "método de pagamento deve ter no máximo 50 caracteres")
        @JsonAlias({"metodoPagamento", "paymentMethod"})
        String paymentMethod,

        @Schema(example = "Compra do mês no supermercado", description = "Observações ou detalhes da compra/prestação de serviço")
        @Size(max = 500, message = "observações devem ter no máximo 500 caracteres")
        @JsonAlias({"observacoes", "detalhes", "notes"})
        String notes
) {
    public TransactionRequest(String description, BigDecimal amount, LocalDate date,
                              TransactionType type, Long categoryId) {
        this(description, amount, date, type, categoryId, TransactionStatus.COMPLETED, null, null);
    }
}
