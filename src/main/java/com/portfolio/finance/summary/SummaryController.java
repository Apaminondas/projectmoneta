package com.portfolio.finance.summary;

import com.portfolio.finance.exception.ApiError;
import com.portfolio.finance.security.AuthenticatedUser;
import com.portfolio.finance.summary.dto.CategoryReportResponse;
import com.portfolio.finance.summary.dto.MonthlySummaryResponse;
import com.portfolio.finance.summary.dto.ReferencePeriodResponse;
import com.portfolio.finance.transaction.ReferencePeriodResolver;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import com.portfolio.finance.report.PdfReportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.YearMonth;

@RestController
@RequestMapping("/api")
@Tag(name = "Resumo e Relatórios", description = "Resumo mensal, totais por categoria e exportação analítica em PDF")
@ApiResponse(responseCode = "401", description = "Token ausente ou inválido",
        content = @Content(schema = @Schema(implementation = ApiError.class)))
public class SummaryController {

    private final SummaryService summaryService;
    private final PdfReportService pdfReportService;
    private final ReferencePeriodResolver referencePeriodResolver;

    public SummaryController(SummaryService summaryService,
                             PdfReportService pdfReportService,
                             ReferencePeriodResolver referencePeriodResolver) {
        this.summaryService = summaryService;
        this.pdfReportService = pdfReportService;
        this.referencePeriodResolver = referencePeriodResolver;
    }

    @GetMapping("/summary/reference-period")
    @Operation(summary = "Período de referência do usuário (mês mais recente com lançamentos ou mês atual)")
    @ApiResponse(responseCode = "200", description = "Período de referência resolvido")
    public ReferencePeriodResponse referencePeriod(@AuthenticationPrincipal AuthenticatedUser user) {
        YearMonth period = referencePeriodResolver.resolve(user.id());
        return new ReferencePeriodResponse(period.getYear(), period.getMonthValue());
    }

    @GetMapping("/summary/monthly")
    @Operation(summary = "Resumo mensal: total de entradas, total de saídas e saldo")
    @ApiResponse(responseCode = "200", description = "Resumo calculado")
    @ApiResponse(responseCode = "400", description = "Ano ou mês inválido",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "422", description = "Nenhum lançamento cadastrado: saldo não pode ser calculado",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public MonthlySummaryResponse monthly(
            @Parameter(description = "Ano", example = "2026")
            @RequestParam @Min(value = 1900, message = "ano deve ser >= 1900")
            @Max(value = 9999, message = "ano deve ser <= 9999") int year,
            @Parameter(description = "Mês (1-12)", example = "10")
            @RequestParam @Min(value = 1, message = "mês deve estar entre 1 e 12")
            @Max(value = 12, message = "mês deve estar entre 1 e 12") int month,
            @AuthenticationPrincipal AuthenticatedUser user) {
        return summaryService.monthly(user.id(), year, month);
    }

    @GetMapping("/reports/categories")
    @Operation(summary = "Relatório com totais de entradas e saídas por categoria (período opcional)")
    @ApiResponse(responseCode = "200", description = "Relatório gerado")
    @ApiResponse(responseCode = "400", description = "Período inválido",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public CategoryReportResponse byCategory(
            @Parameter(description = "Data inicial (inclusive), formato yyyy-MM-dd", example = "2026-10-01")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @Parameter(description = "Data final (inclusive), formato yyyy-MM-dd", example = "2026-10-31")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @AuthenticationPrincipal AuthenticatedUser user) {
        return summaryService.byCategory(user.id(), startDate, endDate);
    }

    @GetMapping(value = "/reports/monthly/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @Operation(summary = "Exporta relatório mensal analítico em formato PDF")
    @ApiResponse(responseCode = "200", description = "PDF gerado com sucesso",
            content = @Content(mediaType = MediaType.APPLICATION_PDF_VALUE))
    @ApiResponse(responseCode = "400", description = "Ano ou mês inválido",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "422", description = "Nenhum lançamento cadastrado: saldo e relatório não podem ser calculados",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public ResponseEntity<byte[]> monthlyPdf(
            @Parameter(description = "Ano", example = "2026")
            @RequestParam @Min(value = 1900, message = "ano deve ser >= 1900")
            @Max(value = 9999, message = "ano deve ser <= 9999") int year,
            @Parameter(description = "Mês (1-12)", example = "10")
            @RequestParam @Min(value = 1, message = "mês deve estar entre 1 e 12")
            @Max(value = 12, message = "mês deve estar entre 1 e 12") int month,
            @AuthenticationPrincipal AuthenticatedUser user) {
        byte[] pdfBytes = pdfReportService.generateMonthlyReportPdf(user.id(), year, month);
        String filename = String.format("relatorio-financeiro-%d-%02d.pdf", year, month);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }
}
