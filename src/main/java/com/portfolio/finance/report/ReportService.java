package com.portfolio.finance.report;

import com.portfolio.finance.category.Category;
import com.portfolio.finance.category.CategoryRepository;
import com.portfolio.finance.exception.BusinessException;
import com.portfolio.finance.exception.ResourceNotFoundException;
import com.portfolio.finance.report.dto.CategoryPdfItem;
import com.portfolio.finance.report.dto.CompanyProfileDto;
import com.portfolio.finance.report.dto.CompanyProfileUpdateRequest;
import com.portfolio.finance.report.dto.FinancialReportPdfData;
import com.portfolio.finance.report.dto.GenerateReportRequest;
import com.portfolio.finance.report.dto.GeneratedReportDto;
import com.portfolio.finance.report.dto.IncomeSourceDto;
import com.portfolio.finance.report.dto.ReportDashboardDto;
import com.portfolio.finance.report.dto.SavingsRateEvolutionDto;
import com.portfolio.finance.report.dto.TransactionPdfItem;
import com.portfolio.finance.report.util.ReportFormatter;
import com.portfolio.finance.summary.SummaryService;
import com.portfolio.finance.summary.dto.CategoryReportResponse;
import com.portfolio.finance.summary.dto.MonthlySummaryResponse;
import com.portfolio.finance.transaction.ReferencePeriodResolver;
import com.portfolio.finance.transaction.Transaction;
import com.portfolio.finance.transaction.TransactionRepository;
import com.portfolio.finance.transaction.TransactionService;
import com.portfolio.finance.transaction.TransactionType;
import com.portfolio.finance.transaction.dto.TransactionResponse;
import com.portfolio.finance.user.User;
import com.portfolio.finance.user.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class ReportService {

    private static final long MAX_LOGO_SIZE = 1024 * 1024; // 1 MB
    private static final String[] MONTH_LABELS = {
            "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
            "Jul", "Ago", "Set", "Out", "Nov", "Dez"
    };

    private final CompanyProfileRepository companyProfileRepository;
    private final GeneratedReportRepository generatedReportRepository;
    private final UserRepository userRepository;
    private final SummaryService summaryService;
    private final CategoryRepository categoryRepository;
    private final TransactionRepository transactionRepository;
    private final TransactionService transactionService;
    private final PdfReportService pdfReportService;
    private final ReferencePeriodResolver referencePeriodResolver;

    @Autowired
    public ReportService(CompanyProfileRepository companyProfileRepository,
                         GeneratedReportRepository generatedReportRepository,
                         UserRepository userRepository,
                         SummaryService summaryService,
                         CategoryRepository categoryRepository,
                         TransactionRepository transactionRepository,
                         TransactionService transactionService,
                         PdfReportService pdfReportService,
                         ReferencePeriodResolver referencePeriodResolver) {
        this.companyProfileRepository = companyProfileRepository;
        this.generatedReportRepository = generatedReportRepository;
        this.userRepository = userRepository;
        this.summaryService = summaryService;
        this.categoryRepository = categoryRepository;
        this.transactionRepository = transactionRepository;
        this.transactionService = transactionService;
        this.pdfReportService = pdfReportService;
        this.referencePeriodResolver = referencePeriodResolver;
    }

    public ReportService(CompanyProfileRepository companyProfileRepository,
                         GeneratedReportRepository generatedReportRepository,
                         UserRepository userRepository,
                         SummaryService summaryService,
                         CategoryRepository categoryRepository,
                         TransactionRepository transactionRepository,
                         TransactionService transactionService,
                         PdfReportService pdfReportService) {
        this(companyProfileRepository, generatedReportRepository, userRepository,
                summaryService, categoryRepository, transactionRepository,
                transactionService, pdfReportService,
                new ReferencePeriodResolver(transactionRepository));
    }

    @Transactional(readOnly = true)
    public CompanyProfileDto getCompanyProfile(Long userId) {
        CompanyProfile profile = companyProfileRepository.findByUserId(userId).orElse(null);
        if (profile == null) {
            return new CompanyProfileDto(
                    "Minha Empresa",
                    "contato@empresa.com",
                    "(11) 98765-4321",
                    "Finance API • Gestão Financeira Corporativa",
                    false,
                    null
            );
        }

        String logoBase64 = null;
        if (profile.getLogoData() != null && profile.getLogoData().length > 0) {
            String mime = profile.getLogoContentType() != null ? profile.getLogoContentType() : "image/png";
            logoBase64 = "data:" + mime + ";base64," + Base64.getEncoder().encodeToString(profile.getLogoData());
        }

        return new CompanyProfileDto(
                profile.getCompanyName(),
                profile.getCompanyEmail(),
                profile.getCompanyPhone(),
                profile.getFooterText(),
                profile.getLogoData() != null && profile.getLogoData().length > 0,
                logoBase64
        );
    }

    public CompanyProfileDto updateCompanyProfile(Long userId, CompanyProfileUpdateRequest request, byte[] logoBytes, String contentType) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário", userId));

        CompanyProfile profile = companyProfileRepository.findByUserId(userId)
                .orElseGet(() -> new CompanyProfile(user, request.companyName(), request.companyEmail(), request.companyPhone(), request.footerText()));

        profile.update(request.companyName(), request.companyEmail(), request.companyPhone(), request.footerText());

        if (logoBytes != null && logoBytes.length > 0) {
            validateLogo(logoBytes, contentType);
            profile.setLogo(logoBytes, contentType != null ? contentType : "image/png");
        }

        profile = companyProfileRepository.save(profile);

        String logoBase64 = null;
        if (profile.getLogoData() != null && profile.getLogoData().length > 0) {
            String mime = profile.getLogoContentType() != null ? profile.getLogoContentType() : "image/png";
            logoBase64 = "data:" + mime + ";base64," + Base64.getEncoder().encodeToString(profile.getLogoData());
        }

        return new CompanyProfileDto(
                profile.getCompanyName(),
                profile.getCompanyEmail(),
                profile.getCompanyPhone(),
                profile.getFooterText(),
                profile.getLogoData() != null && profile.getLogoData().length > 0,
                logoBase64
        );
    }

    public void validateLogo(byte[] bytes, String contentType) {
        if (bytes == null || bytes.length == 0) {
            return;
        }

        if (bytes.length > MAX_LOGO_SIZE) {
            throw new BusinessException("Tamanho do arquivo excede o limite máximo permitido de 1 MB.");
        }

        // Validação estrita por Magic Bytes (apenas PNG ou JPG reais)
        boolean isPng = bytes.length >= 8
                && (bytes[0] & 0xFF) == 0x89
                && bytes[1] == 'P'
                && bytes[2] == 'N'
                && bytes[3] == 'G'
                && bytes[4] == 0x0D
                && bytes[5] == 0x0A
                && bytes[6] == 0x1A
                && bytes[7] == 0x0A;

        boolean isJpg = bytes.length >= 3
                && (bytes[0] & 0xFF) == 0xFF
                && (bytes[1] & 0xFF) == 0xD8
                && (bytes[2] & 0xFF) == 0xFF;

        if (!isPng && !isJpg) {
            throw new BusinessException("Formato de arquivo inválido. Apenas imagens PNG ou JPG são aceitas (SVG e outros formatos não são permitidos).");
        }
    }

    @Transactional(readOnly = true)
    public ReportDashboardDto getReportsDashboard(Long userId) {
        return getReportsDashboard(userId, null, null);
    }

    @Transactional(readOnly = true)
    public ReportDashboardDto getReportsDashboard(Long userId, Integer reqYear, Integer reqMonth) {
        YearMonth refPeriod = referencePeriodResolver.resolve(userId, reqYear, reqMonth);
        int year = refPeriod.getYear();
        int month = refPeriod.getMonthValue();

        List<Transaction> transactions = transactionRepository.findAllByUserIdOrderByDateDesc(userId);

        MonthlySummaryResponse monthly = null;
        if (!transactions.isEmpty()) {
            try {
                monthly = summaryService.monthly(userId, year, month);
            } catch (Exception ignored) {
                monthly = null;
            }
        }
        if (monthly == null) {
            LocalDate start = refPeriod.atDay(1);
            LocalDate end = refPeriod.atEndOfMonth();
            BigDecimal mInc = transactions.stream()
                    .filter(t -> t.getType() == TransactionType.INCOME)
                    .filter(t -> !t.getDate().isBefore(start) && !t.getDate().isAfter(end))
                    .map(Transaction::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal mExp = transactions.stream()
                    .filter(t -> t.getType() == TransactionType.EXPENSE)
                    .filter(t -> !t.getDate().isBefore(start) && !t.getDate().isAfter(end))
                    .map(Transaction::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            monthly = new MonthlySummaryResponse(year, month, mInc, mExp, mInc.subtract(mExp));
        }

        double savingsRate = 0.0;
        if (monthly.totalIncome().compareTo(BigDecimal.ZERO) > 0) {
            savingsRate = monthly.balance().multiply(BigDecimal.valueOf(100))
                    .divide(monthly.totalIncome(), 1, RoundingMode.HALF_UP)
                    .doubleValue();
        }

        // B5: Origem das Receitas reais restrita a lançamentos INCOME cuja categoria seja de receita
        List<Transaction> incomes = transactions.stream()
                .filter(t -> t.getType() == TransactionType.INCOME)
                .filter(t -> isRevenueCategory(t.getCategory()))
                .toList();

        BigDecimal totalIncome = incomes.stream()
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, BigDecimal> byCategory = incomes.stream()
                .collect(Collectors.groupingBy(
                        t -> t.getCategory().getName(),
                        Collectors.reducing(BigDecimal.ZERO, Transaction::getAmount, BigDecimal::add)
                ));

        String[] palette = {"oklch(0.7 0.18 220)", "oklch(0.7 0.18 145)", "oklch(0.75 0.18 55)", "oklch(0.65 0.2 25)", "oklch(0.7 0.15 300)"};
        List<IncomeSourceDto> revenueSources = new ArrayList<>();
        int colorIdx = 0;
        List<Map.Entry<String, BigDecimal>> sortedRevenueEntries = byCategory.entrySet().stream()
                .filter(e -> e.getValue().compareTo(BigDecimal.ZERO) > 0)
                .sorted(Map.Entry.<String, BigDecimal>comparingByValue(Comparator.reverseOrder())
                        .thenComparing(Map.Entry.comparingByKey()))
                .toList();

        for (Map.Entry<String, BigDecimal> entry : sortedRevenueEntries) {
            int pct = totalIncome.compareTo(BigDecimal.ZERO) > 0
                    ? entry.getValue().multiply(BigDecimal.valueOf(100)).divide(totalIncome, 0, RoundingMode.HALF_UP).intValue()
                    : 0;
            revenueSources.add(new IncomeSourceDto(entry.getKey(), entry.getValue(), pct, palette[colorIdx % palette.length]));
            colorIdx++;
        }

        // B3: Série mensal de taxa de poupança calculada apenas com transações reais:
        // (receitas - despesas) / receitas do mês; meses sem receita retornam null; sem dados -> lista vazia
        List<SavingsRateEvolutionDto> evolution = buildRealSavingsRateEvolution(transactions, refPeriod);

        // Previsão e Tetos
        List<Category> categories = categoryRepository.findAllByUserIdOrderByNameAsc(userId);
        BigDecimal totalCeiling = categories.stream()
                .map(c -> c.getMonthlyCeiling() != null ? c.getMonthlyCeiling() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new ReportDashboardDto(
                monthly.totalIncome(),
                monthly.totalExpense(),
                monthly.balance(),
                savingsRate,
                monthly.totalExpense(),
                totalCeiling,
                revenueSources,
                evolution
        );
    }

    /**
     * Verifica se a categoria é uma categoria de receita ({@code kind = "INCOME"}).
     */
    private boolean isRevenueCategory(Category category) {
        return category != null && "INCOME".equalsIgnoreCase(category.getKind());
    }

    private List<SavingsRateEvolutionDto> buildRealSavingsRateEvolution(List<Transaction> transactions,
                                                                        YearMonth refPeriod) {
        if (transactions == null || transactions.isEmpty()) {
            return List.of();
        }

        YearMonth earliestTxMonth = transactions.stream()
                .map(t -> YearMonth.from(t.getDate()))
                .min(Comparator.naturalOrder())
                .orElse(refPeriod);

        YearMonth windowStart = refPeriod.minusMonths(11);
        YearMonth startMonth = earliestTxMonth.isBefore(windowStart) ? windowStart : earliestTxMonth;
        if (startMonth.isAfter(refPeriod)) {
            startMonth = refPeriod;
        }

        Map<YearMonth, BigDecimal> incomeByMonth = transactions.stream()
                .filter(t -> t.getType() == TransactionType.INCOME)
                .collect(Collectors.groupingBy(
                        t -> YearMonth.from(t.getDate()),
                        Collectors.reducing(BigDecimal.ZERO, Transaction::getAmount, BigDecimal::add)
                ));

        Map<YearMonth, BigDecimal> expenseByMonth = transactions.stream()
                .filter(t -> t.getType() == TransactionType.EXPENSE)
                .collect(Collectors.groupingBy(
                        t -> YearMonth.from(t.getDate()),
                        Collectors.reducing(BigDecimal.ZERO, Transaction::getAmount, BigDecimal::add)
                ));

        List<SavingsRateEvolutionDto> evolution = new ArrayList<>();
        YearMonth cursor = startMonth;
        while (!cursor.isAfter(refPeriod)) {
            BigDecimal mIncome = incomeByMonth.getOrDefault(cursor, BigDecimal.ZERO);
            BigDecimal mExpense = expenseByMonth.getOrDefault(cursor, BigDecimal.ZERO);
            Double rate = null;
            if (mIncome.compareTo(BigDecimal.ZERO) > 0) {
                rate = mIncome.subtract(mExpense)
                        .multiply(BigDecimal.valueOf(100))
                        .divide(mIncome, 1, RoundingMode.HALF_UP)
                        .doubleValue();
            }
            evolution.add(new SavingsRateEvolutionDto(MONTH_LABELS[cursor.getMonthValue() - 1], rate));
            cursor = cursor.plusMonths(1);
        }
        return evolution;
    }

    public List<GeneratedReportDto> listGeneratedReports(Long userId) {
        List<GeneratedReport> reports = generatedReportRepository.findAllByUserIdOrderByCreatedAtDesc(userId);

        if (reports.isEmpty()) {
            // Seed de relatórios iniciais
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Usuário", userId));

            GeneratedReport r1 = new GeneratedReport(user, "Extrato Mensal Consolidado (PDF)", "Extrato", "Outubro 2026", "PDF", "COMPLETED", 148200L, null);
            GeneratedReport r2 = new GeneratedReport(user, "Demonstrativo de Fluxo de Caixa (DRE)", "Contábil", "Setembro 2026", "PDF", "COMPLETED", 125400L, null);
            GeneratedReport r3 = new GeneratedReport(user, "Relatório de Despesas por Centro de Custo", "Categorias", "3º Trimestre 2026", "PDF", "COMPLETED", 182100L, null);
            GeneratedReport r4 = new GeneratedReport(user, "Auditoria de Lançamentos & Conciliação", "Auditoria", "Exercício 2026", "PDF", "COMPLETED", 210500L, null);

            generatedReportRepository.saveAll(List.of(r1, r2, r3, r4));
            reports = generatedReportRepository.findAllByUserIdOrderByCreatedAtDesc(userId);
        }

        return reports.stream().map(this::toDto).toList();
    }

    public GeneratedReportDto generateReport(Long userId, GenerateReportRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário", userId));

        int yr = request.year() != null ? request.year() : LocalDate.now().getYear();
        int mth = request.month() != null ? request.month() : LocalDate.now().getMonthValue();

        byte[] pdfBytes = generateCustomPdfBytes(user, yr, mth, request.title());

        String periodStr = String.format("%02d/%d", mth, yr);
        GeneratedReport report = new GeneratedReport(
                user,
                request.title(),
                request.reportType(),
                periodStr,
                "PDF",
                "COMPLETED",
                (long) pdfBytes.length,
                pdfBytes
        );

        report = generatedReportRepository.save(report);
        return toDto(report);
    }

    public ReportDownloadResult downloadReport(Long userId, Long reportId) {
        GeneratedReport report = generatedReportRepository.findByIdAndUserId(reportId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Relatório", reportId));

        byte[] pdfBytes = report.getPdfData();
        if (pdfBytes == null || pdfBytes.length == 0) {
            LocalDate now = LocalDate.now();
            pdfBytes = generateCustomPdfBytes(report.getUser(), now.getYear(), now.getMonthValue(), report.getTitle());
            report.complete(pdfBytes, (long) pdfBytes.length);
        }

        report.incrementDownloadCount();
        generatedReportRepository.save(report);

        String cleanType = report.getReportType().toLowerCase().replaceAll("[^a-z0-9]", "-");
        String cleanPeriod = report.getPeriod().replaceAll("[^a-z0-9]", "-");
        String dateStr = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String filename = String.format("relatorio-%s-%s-%s.pdf", cleanType, cleanPeriod, dateStr);

        return new ReportDownloadResult(pdfBytes, filename);
    }

    private byte[] generateCustomPdfBytes(User user, int year, int month, String customTitle) {
        CompanyProfile profile = companyProfileRepository.findByUserId(user.getId()).orElse(null);
        String logoBase64 = null;
        String companyName = profile != null ? profile.getCompanyName() : user.getName();
        String companyEmail = profile != null ? profile.getCompanyEmail() : user.getEmail();
        String companyPhone = profile != null ? profile.getCompanyPhone() : null;
        String footerText = profile != null ? profile.getFooterText() : "Finance API • Documento Confidencial";

        if (profile != null && profile.getLogoData() != null && profile.getLogoData().length > 0) {
            String mime = profile.getLogoContentType() != null ? profile.getLogoContentType() : "image/png";
            logoBase64 = "data:" + mime + ";base64," + Base64.getEncoder().encodeToString(profile.getLogoData());
        }

        MonthlySummaryResponse monthly;
        try {
            monthly = summaryService.monthly(user.getId(), year, month);
        } catch (Exception e) {
            monthly = new MonthlySummaryResponse(year, month, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO);
        }

        YearMonth period = YearMonth.of(year, month);
        LocalDate start = period.atDay(1);
        LocalDate end = period.atEndOfMonth();

        CategoryReportResponse categoryReport;
        try {
            categoryReport = summaryService.byCategory(user.getId(), start, end);
        } catch (Exception e) {
            categoryReport = new CategoryReportResponse(start, end, BigDecimal.ZERO, BigDecimal.ZERO, List.of());
        }

        List<CategoryPdfItem> categoryItems = buildCategoryItems(categoryReport);

        List<TransactionResponse> transactions = transactionService.list(user.getId(), start, end, null);
        List<TransactionPdfItem> transactionItems = transactions.stream()
                .sorted(Comparator.comparing(TransactionResponse::date).thenComparing(TransactionResponse::id))
                .map(this::toPdfItem)
                .toList();

        String savingsRate = calculateSavingsRate(monthly.totalIncome(), monthly.balance());
        boolean isPositive = monthly.balance().compareTo(BigDecimal.ZERO) >= 0;
        String formattedBalance = (isPositive ? "+ " : "") + ReportFormatter.formatCurrency(monthly.balance());

        FinancialReportPdfData reportData = new FinancialReportPdfData(
                user.getName(),
                user.getEmail(),
                year,
                month,
                ReportFormatter.formatMonthYear(year, month),
                ReportFormatter.formatDateTime(LocalDateTime.now()),
                String.format("REP-%d%02d-%d", year, month, user.getId()),
                monthly.totalIncome(),
                monthly.totalExpense(),
                monthly.balance(),
                ReportFormatter.formatCurrency(monthly.totalIncome()),
                ReportFormatter.formatCurrency(monthly.totalExpense()),
                formattedBalance,
                isPositive,
                savingsRate,
                categoryItems,
                transactionItems,
                transactionItems.size(),
                companyName,
                companyEmail,
                companyPhone,
                footerText,
                logoBase64
        );

        String html = pdfReportService.renderHtml(reportData);
        return pdfReportService.renderPdf(html);
    }

    private List<CategoryPdfItem> buildCategoryItems(CategoryReportResponse categoryReport) {
        BigDecimal totalExpense = categoryReport.totalExpense();
        return categoryReport.categories().stream()
                .filter(cat -> cat.totalExpense().compareTo(BigDecimal.ZERO) > 0)
                .sorted(Comparator.comparing(CategoryReportResponse.CategoryTotal::totalExpense).reversed())
                .map(cat -> {
                    double percentage = 0.0;
                    if (totalExpense.compareTo(BigDecimal.ZERO) > 0) {
                        percentage = cat.totalExpense()
                                .multiply(BigDecimal.valueOf(100))
                                .divide(totalExpense, 1, RoundingMode.HALF_UP)
                                .doubleValue();
                    }
                    return new CategoryPdfItem(
                            cat.categoryName(),
                            cat.totalExpense(),
                            ReportFormatter.formatCurrency(cat.totalExpense()),
                            percentage,
                            ReportFormatter.formatPercentage(percentage)
                    );
                })
                .toList();
    }

    private TransactionPdfItem toPdfItem(TransactionResponse t) {
        boolean isIncome = t.type() == TransactionType.INCOME;
        String sign = isIncome ? "+ " : "- ";
        String formattedAmount = sign + ReportFormatter.formatCurrency(t.amount());
        String typeLabel = isIncome ? "Receita" : "Despesa";

        return new TransactionPdfItem(
                t.id(),
                t.date(),
                ReportFormatter.formatDate(t.date()),
                t.description(),
                t.categoryName(),
                t.type().name(),
                typeLabel,
                isIncome,
                t.amount(),
                formattedAmount
        );
    }

    private String calculateSavingsRate(BigDecimal totalIncome, BigDecimal balance) {
        if (totalIncome.compareTo(BigDecimal.ZERO) > 0 && balance.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal rate = balance.multiply(BigDecimal.valueOf(100))
                    .divide(totalIncome, 1, RoundingMode.HALF_UP);
            return ReportFormatter.formatPercentage(rate.doubleValue());
        }
        return "0,0%";
    }

    private GeneratedReportDto toDto(GeneratedReport r) {
        String formattedSize = r.getFileSizeBytes() != null
                ? String.format("%.1f KB", r.getFileSizeBytes() / 1024.0)
                : "145.0 KB";
        return new GeneratedReportDto(
                r.getId(),
                r.getTitle(),
                r.getReportType(),
                r.getPeriod(),
                r.getFileFormat(),
                r.getStatus(),
                r.getFileSizeBytes(),
                formattedSize,
                r.getCreatedAt(),
                r.getDownloadCount()
        );
    }

    public record ReportDownloadResult(byte[] data, String filename) {}
}
