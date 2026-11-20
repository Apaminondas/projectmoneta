package com.portfolio.finance.report;

import com.portfolio.finance.report.util.ReportFormatter;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("Testes Unitários: ReportFormatter (pt-BR)")
class ReportFormatterTest {

    @Test
    void formatsCurrencyCorrectly() {
        String formatted = ReportFormatter.formatCurrency(new BigDecimal("1234.56"));
        assertThat(formatted).contains("1.234,56").contains("R$");
    }

    @Test
    void formatsNullCurrencyAsZero() {
        String formatted = ReportFormatter.formatCurrency(null);
        assertThat(formatted).contains("0,00").contains("R$");
    }

    @Test
    void formatsDateCorrectly() {
        LocalDate date = LocalDate.of(2026, 10, 9);
        assertThat(ReportFormatter.formatDate(date)).isEqualTo("09/10/2026");
    }

    @Test
    void formatsNullDateAsDash() {
        assertThat(ReportFormatter.formatDate(null)).isEqualTo("-");
    }

    @Test
    void formatsDateTimeCorrectly() {
        LocalDateTime dt = LocalDateTime.of(2026, 10, 9, 17, 30, 45);
        assertThat(ReportFormatter.formatDateTime(dt)).isEqualTo("09/10/2026 17:30:45");
    }

    @Test
    void formatsMonthYearInPortuguese() {
        String formatted = ReportFormatter.formatMonthYear(2026, 10);
        assertThat(formatted).isEqualTo("Outubro de 2026");
    }

    @Test
    void formatsPercentageWithDecimal() {
        assertThat(ReportFormatter.formatPercentage(45.54)).isEqualTo("45,5%");
    }
}
