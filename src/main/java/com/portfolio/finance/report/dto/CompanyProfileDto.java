package com.portfolio.finance.report.dto;

public record CompanyProfileDto(
        String companyName,
        String companyEmail,
        String companyPhone,
        String footerText,
        boolean hasLogo,
        String logoBase64
) {
}
