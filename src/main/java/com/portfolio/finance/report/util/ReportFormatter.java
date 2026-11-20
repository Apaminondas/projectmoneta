package com.portfolio.finance.report.util;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Month;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.Locale;

public final class ReportFormatter {

    public static final Locale PT_BR = Locale.forLanguageTag("pt-BR");
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");

    private ReportFormatter() {
    }

    public static String formatCurrency(BigDecimal value) {
        if (value == null) {
            value = BigDecimal.ZERO;
        }
        NumberFormat nf = NumberFormat.getCurrencyInstance(PT_BR);
        return nf.format(value);
    }

    public static String formatDate(LocalDate date) {
        if (date == null) {
            return "-";
        }
        return date.format(DATE_FORMATTER);
    }

    public static String formatDateTime(LocalDateTime dateTime) {
        if (dateTime == null) {
            return "-";
        }
        return dateTime.format(DATE_TIME_FORMATTER);
    }

    public static String formatMonthYear(int year, int month) {
        String monthName = Month.of(month).getDisplayName(TextStyle.FULL, PT_BR);
        if (monthName != null && !monthName.isEmpty()) {
            monthName = Character.toUpperCase(monthName.charAt(0)) + monthName.substring(1);
        }
        return monthName + " de " + year;
    }

    public static String formatPercentage(double value) {
        return String.format(PT_BR, "%.1f%%", value);
    }
}
