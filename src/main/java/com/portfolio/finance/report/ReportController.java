package com.portfolio.finance.report;

import com.portfolio.finance.exception.ApiError;
import com.portfolio.finance.report.dto.CompanyProfileDto;
import com.portfolio.finance.report.dto.CompanyProfileUpdateRequest;
import com.portfolio.finance.report.dto.GenerateReportRequest;
import com.portfolio.finance.report.dto.GeneratedReportDto;
import com.portfolio.finance.report.dto.ReportDashboardDto;
import com.portfolio.finance.security.AuthenticatedUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/reports")
@Tag(name = "Relatórios e Documentos", description = "Gestão de relatórios contábeis, exportação de PDF e perfil corporativo")
@ApiResponse(responseCode = "401", description = "Token ausente ou inválido",
        content = @Content(schema = @Schema(implementation = ApiError.class)))
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/dashboard")
    @Operation(summary = "Retorna métricas consolidadas, taxa de poupança, evolução e origens de receita")
    public ReportDashboardDto getDashboard(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month,
            @AuthenticationPrincipal AuthenticatedUser user) {
        return reportService.getReportsDashboard(user.id(), year, month);
    }

    @GetMapping("/profile")
    @Operation(summary = "Retorna os dados cadastrais da empresa e logo para os relatórios")
    public CompanyProfileDto getProfile(@AuthenticationPrincipal AuthenticatedUser user) {
        return reportService.getCompanyProfile(user.id());
    }

    @PutMapping("/profile")
    @Operation(summary = "Atualiza os dados cadastrais da empresa e rodapé dos relatórios")
    public CompanyProfileDto updateProfile(
            @Valid @RequestBody CompanyProfileUpdateRequest request,
            @AuthenticationPrincipal AuthenticatedUser user) {
        return reportService.updateCompanyProfile(user.id(), request, null, null);
    }

    @PostMapping(value = "/profile/logo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload de logo da empresa (apenas PNG ou JPG até 1 MB, validado no servidor)")
    @ApiResponse(responseCode = "200", description = "Logo validado e salvo com sucesso")
    @ApiResponse(responseCode = "422", description = "Arquivo inválido ou excede 1 MB",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public CompanyProfileDto uploadLogo(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal AuthenticatedUser user) throws IOException {
        byte[] bytes = file.getBytes();
        CompanyProfileUpdateRequest dummyReq = new CompanyProfileUpdateRequest(null, null, null, null);
        return reportService.updateCompanyProfile(user.id(), dummyReq, bytes, file.getContentType());
    }

    @GetMapping("/history")
    @Operation(summary = "Lista o histórico de relatórios gerados do usuário")
    public List<GeneratedReportDto> listReports(@AuthenticationPrincipal AuthenticatedUser user) {
        return reportService.listGeneratedReports(user.id());
    }

    @PostMapping("/generate")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Gera um novo relatório analítico em formato PDF")
    @ApiResponse(responseCode = "201", description = "Relatório gerado com sucesso")
    public GeneratedReportDto generateReport(
            @Valid @RequestBody GenerateReportRequest request,
            @AuthenticationPrincipal AuthenticatedUser user) {
        return reportService.generateReport(user.id(), request);
    }

    @GetMapping("/{id}/download")
    @Operation(summary = "Faz o download do PDF do relatório gerado com nome padronizado")
    @ApiResponse(responseCode = "200", description = "Arquivo PDF pronto para download",
            content = @Content(mediaType = MediaType.APPLICATION_PDF_VALUE))
    @ApiResponse(responseCode = "404", description = "Relatório não encontrado ou de outro usuário",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public ResponseEntity<byte[]> downloadReport(
            @PathVariable Long id,
            @AuthenticationPrincipal AuthenticatedUser user) {
        ReportService.ReportDownloadResult result = reportService.downloadReport(user.id(), id);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + result.filename() + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(result.data());
    }
}
