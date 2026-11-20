package com.portfolio.finance.report;

import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import com.portfolio.finance.exception.ResourceNotFoundException;
import com.portfolio.finance.report.dto.CategoryPdfItem;
import com.portfolio.finance.report.dto.FinancialReportPdfData;
import com.portfolio.finance.report.dto.TransactionPdfItem;
import com.portfolio.finance.report.util.ReportFormatter;
import com.portfolio.finance.summary.SummaryService;
import com.portfolio.finance.summary.dto.CategoryReportResponse;
import com.portfolio.finance.summary.dto.MonthlySummaryResponse;
import com.portfolio.finance.transaction.TransactionService;
import com.portfolio.finance.transaction.TransactionType;
import com.portfolio.finance.transaction.dto.TransactionResponse;
import com.portfolio.finance.user.User;
import com.portfolio.finance.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thymeleaf.ITemplateEngine;
import org.thymeleaf.context.Context;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.Comparator;
import java.util.List;

@Service
public class PdfReportService {

    private final SummaryService summaryService;
    private final TransactionService transactionService;
    private final UserRepository userRepository;
    private final ITemplateEngine templateEngine;
    private final Clock clock;

    public PdfReportService(SummaryService summaryService,
                            TransactionService transactionService,
                            UserRepository userRepository,
                            ITemplateEngine templateEngine,
                            Clock clock) {
        this.summaryService = summaryService;
        this.transactionService = transactionService;
        this.userRepository = userRepository;
        this.templateEngine = templateEngine;
        this.clock = clock;
    }

    /**
     * Gera o relatório mensal analítico em formato PDF para o usuário autenticado.
     * Segue a Regra 4: dispara BusinessException (422) se o usuário não possuir lançamentos cadastrados.
     * Segue a Regra 3: isolamento estrito de dados pelo userId informado.
     */
    @Transactional(readOnly = true)
    public byte[] generateMonthlyReportPdf(Long userId, int year, int month) {
        // Regra 4: summaryService.monthly valida se o usuário possui lançamentos no histórico
        MonthlySummaryResponse monthly = summaryService.monthly(userId, year, month);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário", userId));

        YearMonth period = YearMonth.of(year, month);
        LocalDate start = period.atDay(1);
        LocalDate end = period.atEndOfMonth();

        // Distribuição por categorias no período
        CategoryReportResponse categoryReport = summaryService.byCategory(userId, start, end);
        List<CategoryPdfItem> categoryItems = buildCategoryItems(categoryReport);

        // Extrato detalhado de transações (ordem cronológica para leitura sequencial)
        List<TransactionResponse> transactions = transactionService.list(userId, start, end, null);
        List<TransactionPdfItem> transactionItems = transactions.stream()
                .sorted(Comparator.comparing(TransactionResponse::date).thenComparing(TransactionResponse::id))
                .map(this::toPdfItem)
                .toList();

        // Indicador de taxa de poupança (% da receita líquida preservada)
        String savingsRate = calculateSavingsRate(monthly.totalIncome(), monthly.balance());

        boolean isPositive = monthly.balance().compareTo(BigDecimal.ZERO) >= 0;
        String formattedBalance = (isPositive ? "+ " : "") + ReportFormatter.formatCurrency(monthly.balance());

        FinancialReportPdfData reportData = new FinancialReportPdfData(
                user.getName(),
                user.getEmail(),
                year,
                month,
                ReportFormatter.formatMonthYear(year, month),
                ReportFormatter.formatDateTime(LocalDateTime.now(clock)),
                String.format("REP-%d%02d-%d", year, month, userId),
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
                transactionItems.size()
        );

        String html = renderHtml(reportData);
        return renderPdf(html);
    }

    public String renderHtml(FinancialReportPdfData reportData) {
        Context context = new Context(ReportFormatter.PT_BR);
        context.setVariable("report", reportData);
        return templateEngine.process("reports/monthly-report", context);
    }

    public byte[] renderPdf(String html) {
        try (ByteArrayOutputStream os = new ByteArrayOutputStream()) {
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFastMode();
            builder.withHtmlContent(html, null);
            builder.toStream(os);
            builder.run();
            return os.toByteArray();
        } catch (Exception e) {
            throw new IllegalStateException("Falha ao renderizar PDF do relatório financeiro", e);
        }
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
}
