package com.portfolio.finance.report.dto;

import java.math.BigDecimal;
import java.util.List;

public record FinancialReportPdfData(
        String userName,
        String userEmail,
        int year,
        int month,
        String formattedPeriod,
        String formattedGeneratedAt,
        String reportCode,
        BigDecimal totalIncome,
        BigDecimal totalExpense,
        BigDecimal balance,
        String formattedTotalIncome,
        String formattedTotalExpense,
        String formattedBalance,
        boolean positiveBalance,
        String savingsRate,
        List<CategoryPdfItem> categories,
        List<TransactionPdfItem> transactions,
        int transactionCount,
        String companyName,
        String companyEmail,
        String companyPhone,
        String footerText,
        String logoBase64
) {
    public FinancialReportPdfData(
            String userName,
            String userEmail,
            int year,
            int month,
            String formattedPeriod,
            String formattedGeneratedAt,
            String reportCode,
            BigDecimal totalIncome,
            BigDecimal totalExpense,
            BigDecimal balance,
            String formattedTotalIncome,
            String formattedTotalExpense,
            String formattedBalance,
            boolean positiveBalance,
            String savingsRate,
            List<CategoryPdfItem> categories,
            List<TransactionPdfItem> transactions,
            int transactionCount
    ) {
        this(
                userName, userEmail, year, month, formattedPeriod, formattedGeneratedAt, reportCode,
                totalIncome, totalExpense, balance, formattedTotalIncome, formattedTotalExpense, formattedBalance,
                positiveBalance, savingsRate, categories, transactions, transactionCount,
                null, null, null, null, null
        );
    }
}
