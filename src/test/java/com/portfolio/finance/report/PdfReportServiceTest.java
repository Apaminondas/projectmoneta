package com.portfolio.finance.report;

import com.portfolio.finance.exception.BusinessException;
import com.portfolio.finance.exception.ResourceNotFoundException;
import com.portfolio.finance.summary.SummaryService;
import com.portfolio.finance.summary.dto.CategoryReportResponse;
import com.portfolio.finance.summary.dto.MonthlySummaryResponse;
import com.portfolio.finance.transaction.TransactionService;
import com.portfolio.finance.transaction.TransactionType;
import com.portfolio.finance.transaction.dto.TransactionResponse;
import com.portfolio.finance.user.User;
import com.portfolio.finance.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.thymeleaf.ITemplateEngine;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes Unitários: PdfReportService")
class PdfReportServiceTest {

    private static final Long USER_ID = 1L;
    private static final int YEAR = 2026;
    private static final int MONTH = 10;

    @Mock
    private SummaryService summaryService;

    @Mock
    private TransactionService transactionService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ITemplateEngine templateEngine;

    private Clock clock;
    private PdfReportService service;

    @BeforeEach
    void setUp() {
        clock = Clock.fixed(Instant.parse("2026-10-09T12:00:00Z"), ZoneId.of("UTC"));
        service = new PdfReportService(summaryService, transactionService, userRepository, templateEngine, clock);
    }

    @Test
    @DisplayName("Regra 4: propaga BusinessException quando o usuário não possui lançamentos")
    void throwsBusinessExceptionWhenNoTransactions() {
        when(summaryService.monthly(USER_ID, YEAR, MONTH))
                .thenThrow(new BusinessException("Não é possível calcular o saldo: nenhum lançamento cadastrado."));

        assertThatThrownBy(() -> service.generateMonthlyReportPdf(USER_ID, YEAR, MONTH))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("nenhum lançamento cadastrado");
    }

    @Test
    @DisplayName("Lança ResourceNotFoundException se usuário não for encontrado no banco")
    void throwsResourceNotFoundWhenUserNotFound() {
        when(summaryService.monthly(USER_ID, YEAR, MONTH))
                .thenReturn(new MonthlySummaryResponse(YEAR, MONTH, BigDecimal.TEN, BigDecimal.ONE, new BigDecimal("9")));
        when(userRepository.findById(USER_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.generateMonthlyReportPdf(USER_ID, YEAR, MONTH))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("Gera bytes válidos de PDF quando dados existem")
    void generatesValidPdfBytes() {
        when(summaryService.monthly(USER_ID, YEAR, MONTH))
                .thenReturn(new MonthlySummaryResponse(YEAR, MONTH,
                        new BigDecimal("5000.00"), new BigDecimal("2000.00"), new BigDecimal("3000.00")));

        User user = new User("João Silva", "joao@example.test", "hash");
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));

        LocalDate start = LocalDate.of(YEAR, MONTH, 1);
        LocalDate end = LocalDate.of(YEAR, MONTH, 31);

        CategoryReportResponse.CategoryTotal catTotal =
                new CategoryReportResponse.CategoryTotal(10L, "Moradia", BigDecimal.ZERO, new BigDecimal("1200.00"));
        CategoryReportResponse categoryReport = new CategoryReportResponse(
                start, end, BigDecimal.ZERO, new BigDecimal("1200.00"), List.of(catTotal));
        when(summaryService.byCategory(USER_ID, start, end)).thenReturn(categoryReport);

        TransactionResponse tx1 = new TransactionResponse(1L, "Salário", new BigDecimal("5000.00"),
                start, TransactionType.INCOME, 20L, "Trabalho");
        TransactionResponse tx2 = new TransactionResponse(2L, "Aluguel", new BigDecimal("1200.00"),
                start.plusDays(5), TransactionType.EXPENSE, 10L, "Moradia");
        when(transactionService.list(USER_ID, start, end, null)).thenReturn(List.of(tx1, tx2));

        String mockHtml = "<html><head><title>Relatório</title></head><body><h1>Relatório Financeiro</h1></body></html>";
        when(templateEngine.process(eq("reports/monthly-report"), any())).thenReturn(mockHtml);

        byte[] pdfBytes = service.generateMonthlyReportPdf(USER_ID, YEAR, MONTH);

        assertThat(pdfBytes).isNotNull();
        assertThat(pdfBytes.length).isGreaterThan(100);

        // Assinatura mágica do arquivo PDF: '%PDF-'
        String header = new String(pdfBytes, 0, 5, StandardCharsets.US_ASCII);
        assertThat(header).isEqualTo("%PDF-");

        verify(templateEngine).process(eq("reports/monthly-report"), any());
    }
}
