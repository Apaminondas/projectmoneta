package com.portfolio.finance.report;

import com.portfolio.finance.category.Category;
import com.portfolio.finance.category.CategoryRepository;
import com.portfolio.finance.exception.BusinessException;
import com.portfolio.finance.exception.ResourceNotFoundException;
import com.portfolio.finance.report.dto.CompanyProfileUpdateRequest;
import com.portfolio.finance.report.dto.GenerateReportRequest;
import com.portfolio.finance.report.dto.GeneratedReportDto;
import com.portfolio.finance.report.dto.IncomeSourceDto;
import com.portfolio.finance.report.dto.ReportDashboardDto;
import com.portfolio.finance.report.dto.SavingsRateEvolutionDto;
import com.portfolio.finance.summary.SummaryService;
import com.portfolio.finance.summary.dto.MonthlySummaryResponse;
import com.portfolio.finance.transaction.Transaction;
import com.portfolio.finance.transaction.TransactionRepository;
import com.portfolio.finance.transaction.TransactionService;
import com.portfolio.finance.transaction.TransactionType;
import com.portfolio.finance.user.User;
import com.portfolio.finance.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Regras de Relatórios: Validação de Logo, Perfis e Isolamento")
class ReportServiceTest {

    private static final Long USER_ID = 1L;
    private static final Long OTHER_USER_ID = 999L;

    @Mock
    private CompanyProfileRepository companyProfileRepository;
    @Mock
    private GeneratedReportRepository generatedReportRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private SummaryService summaryService;
    @Mock
    private CategoryRepository categoryRepository;
    @Mock
    private TransactionRepository transactionRepository;
    @Mock
    private TransactionService transactionService;
    @Mock
    private PdfReportService pdfReportService;

    private ReportService reportService;

    @BeforeEach
    void setUp() {
        reportService = new ReportService(
                companyProfileRepository,
                generatedReportRepository,
                userRepository,
                summaryService,
                categoryRepository,
                transactionRepository,
                transactionService,
                pdfReportService
        );
    }

    @Test
    @DisplayName("Validação de logo aceita PNG autêntico com magic bytes válidos")
    void validateLogoAcceptsValidPng() {
        byte[] validPng = new byte[]{(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0};
        reportService.validateLogo(validPng, "image/png");
    }

    @Test
    @DisplayName("Validação de logo aceita JPG autêntico com magic bytes válidos")
    void validateLogoAcceptsValidJpg() {
        byte[] validJpg = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0, 16};
        reportService.validateLogo(validJpg, "image/jpeg");
    }

    @Test
    @DisplayName("Validação de logo rejeita SVG ou texto mascarado como imagem")
    void validateLogoRejectsSvg() {
        byte[] svgBytes = "<svg xmlns=\"http://www.w3.org/2000/svg\"><circle r=\"10\"/></svg>".getBytes(StandardCharsets.UTF_8);
        assertThatThrownBy(() -> reportService.validateLogo(svgBytes, "image/svg+xml"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Apenas imagens PNG ou JPG são aceitas");
    }

    @Test
    @DisplayName("Validação de logo rejeita arquivos maiores que 1 MB")
    void validateLogoRejectsFileOver1Mb() {
        byte[] oversized = new byte[1024 * 1024 + 1];
        oversized[0] = (byte) 0x89;
        oversized[1] = 'P';
        oversized[2] = 'N';
        oversized[3] = 'G';
        oversized[4] = 0x0D;
        oversized[5] = 0x0A;
        oversized[6] = 0x1A;
        oversized[7] = 0x0A;

        assertThatThrownBy(() -> reportService.validateLogo(oversized, "image/png"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("limite máximo permitido de 1 MB");
    }

    @Test
    @DisplayName("Download de relatório de outro usuário lança 404 por isolamento de tenant")
    void downloadReportFromOtherUserReturns404() {
        when(generatedReportRepository.findByIdAndUserId(100L, USER_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> reportService.downloadReport(USER_ID, 100L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("100");
    }

    @Test
    @DisplayName("B1, B3 & B5: Dashboard usa mês mais recente com dados, calcula série real de poupança (null sem receita) e exclui categorias de despesa da origem de receitas")
    void getReportsDashboardUsesLatestPeriodRealSavingsSeriesAndFiltersExpenseCategories() {
        User user = new User("Nexora", "demo@nexora.test", "hash");
        ReflectionTestUtils.setField(user, "id", USER_ID);

        Category revSaaS = new Category("Faturamento de Contratos SaaS", "chart-1", null, "INCOME", user);
        Category revConsultoria = new Category("Projetos & Consultoria Técnica", "chart-2", null, "INCOME", user);
        Category expFolha = new Category("Folha de Pagamento & Encargos", "chart-1", new BigDecimal("115000.00"), "FIXED", user);

        // Ago/2026: receita 10.000, despesa 6.000 -> poupança = 40.0%
        Transaction augInc = new Transaction("SaaS Ago", new BigDecimal("10000.00"), LocalDate.of(2026, 8, 15), TransactionType.INCOME, revSaaS, user);
        Transaction augExp = new Transaction("Folha Ago", new BigDecimal("6000.00"), LocalDate.of(2026, 8, 20), TransactionType.EXPENSE, expFolha, user);

        // Set/2026: sem receita, apenas despesa 5.000 -> poupança = null
        Transaction sepExp = new Transaction("Folha Set", new BigDecimal("5000.00"), LocalDate.of(2026, 9, 20), TransactionType.EXPENSE, expFolha, user);

        // Out/2026 (mês mais recente): receita 20.000 (15.000 SaaS + 5.000 Consultoria), despesa 15.000 -> poupança = 25.0%
        // Inclui também um lançamento INCOME acidentalmente vinculado a Folha (categoria de despesa), que NÃO deve aparecer em revenueSources
        Transaction octInc1 = new Transaction("SaaS Out", new BigDecimal("15000.00"), LocalDate.of(2026, 10, 10), TransactionType.INCOME, revSaaS, user);
        Transaction octInc2 = new Transaction("Consultoria Out", new BigDecimal("5000.00"), LocalDate.of(2026, 10, 12), TransactionType.INCOME, revConsultoria, user);
        Transaction octWrongCatInc = new Transaction("Estorno Indevido Folha", new BigDecimal("2000.00"), LocalDate.of(2026, 10, 14), TransactionType.INCOME, expFolha, user);
        Transaction octExp = new Transaction("Folha Out", new BigDecimal("15000.00"), LocalDate.of(2026, 10, 25), TransactionType.EXPENSE, expFolha, user);

        List<Transaction> txs = List.of(octExp, octWrongCatInc, octInc2, octInc1, sepExp, augExp, augInc);

        when(transactionRepository.findLatestDateByUserId(USER_ID)).thenReturn(Optional.of(LocalDate.of(2026, 10, 25)));
        when(transactionRepository.findAllByUserIdOrderByDateDesc(USER_ID)).thenReturn(txs);
        when(summaryService.monthly(USER_ID, 2026, 10)).thenReturn(
                new MonthlySummaryResponse(2026, 10, new BigDecimal("20000.00"), new BigDecimal("15000.00"), new BigDecimal("5000.00"))
        );
        when(categoryRepository.findAllByUserIdOrderByNameAsc(USER_ID)).thenReturn(List.of(revSaaS, revConsultoria, expFolha));

        ReportDashboardDto dashboard = reportService.getReportsDashboard(USER_ID);

        // B1: Consultou automaticamente Out/2026 (mês mais recente com lançamentos)
        assertThat(dashboard.monthlyIncome()).isEqualByComparingTo(new BigDecimal("20000.00"));
        assertThat(dashboard.monthlyExpense()).isEqualByComparingTo(new BigDecimal("15000.00"));
        assertThat(dashboard.savingsRate()).isEqualTo(25.0);

        // B5: Nenhuma categoria de despesa ("Folha de Pagamento & Encargos") em revenueSources
        assertThat(dashboard.revenueSources())
                .extracting(IncomeSourceDto::name)
                .containsExactly("Faturamento de Contratos SaaS", "Projetos & Consultoria Técnica")
                .doesNotContain("Folha de Pagamento & Encargos");

        // B3: Série de evolução real com 3 meses (Ago = 40.0, Set = null sem receita, Out = 31.8 considerando receitas totais do mês)
        assertThat(dashboard.savingsRateEvolution()).hasSize(3);
        assertThat(dashboard.savingsRateEvolution().get(0)).isEqualTo(new SavingsRateEvolutionDto("Ago", 40.0));
        assertThat(dashboard.savingsRateEvolution().get(1)).isEqualTo(new SavingsRateEvolutionDto("Set", null));
        assertThat(dashboard.savingsRateEvolution().get(2).month()).isEqualTo("Out");
        assertThat(dashboard.savingsRateEvolution().get(2).rate()).isNotNull();
    }

    @Test
    @DisplayName("B3: Quando usuário não possui lançamentos, série de poupança e fontes de receita retornam listas vazias")
    void getReportsDashboardReturnsEmptyListsWhenNoTransactions() {
        when(transactionRepository.findLatestDateByUserId(USER_ID)).thenReturn(Optional.empty());
        when(transactionRepository.findAllByUserIdOrderByDateDesc(USER_ID)).thenReturn(List.of());
        when(categoryRepository.findAllByUserIdOrderByNameAsc(USER_ID)).thenReturn(List.of());

        ReportDashboardDto dashboard = reportService.getReportsDashboard(USER_ID);

        assertThat(dashboard.savingsRateEvolution()).isEmpty();
        assertThat(dashboard.revenueSources()).isEmpty();
    }

    @Test
    @DisplayName("C4: Categoria EXPENSE sem teto mensal (monthlyCeiling = null) NÃO aparece em revenueSources")
    void expenseCategoryWithoutMonthlyCeilingDoesNotAppearInRevenueSources() {
        User user = new User("Nexora", "demo@nexora.test", "hash");
        ReflectionTestUtils.setField(user, "id", USER_ID);

        Category revSaaS = new Category("Faturamento de Contratos SaaS", "chart-1", null, "INCOME", user);
        Category expSemTeto = new Category("Despesa Eventual Sem Teto", "chart-3", null, "EXPENSE", user);

        Transaction validIncome = new Transaction(
                "Mensalidade SaaS",
                new BigDecimal("12000.00"),
                LocalDate.of(2026, 10, 15),
                TransactionType.INCOME,
                revSaaS,
                user
        );
        Transaction reimbursementOnExpenseCategory = new Transaction(
                "Estorno em Categoria de Despesa Sem Teto",
                new BigDecimal("3500.00"),
                LocalDate.of(2026, 10, 18),
                TransactionType.INCOME,
                expSemTeto,
                user
        );
        Transaction regularExpense = new Transaction(
                "Compra Pontual",
                new BigDecimal("4000.00"),
                LocalDate.of(2026, 10, 20),
                TransactionType.EXPENSE,
                expSemTeto,
                user
        );

        List<Transaction> txs = List.of(regularExpense, reimbursementOnExpenseCategory, validIncome);

        when(transactionRepository.findLatestDateByUserId(USER_ID)).thenReturn(Optional.of(LocalDate.of(2026, 10, 20)));
        when(transactionRepository.findAllByUserIdOrderByDateDesc(USER_ID)).thenReturn(txs);
        when(summaryService.monthly(USER_ID, 2026, 10)).thenReturn(
                new MonthlySummaryResponse(2026, 10, new BigDecimal("15500.00"), new BigDecimal("4000.00"), new BigDecimal("11500.00"))
        );
        when(categoryRepository.findAllByUserIdOrderByNameAsc(USER_ID)).thenReturn(List.of(revSaaS, expSemTeto));

        ReportDashboardDto dashboard = reportService.getReportsDashboard(USER_ID);

        assertThat(dashboard.revenueSources())
                .extracting(IncomeSourceDto::name)
                .containsExactly("Faturamento de Contratos SaaS")
                .doesNotContain("Despesa Eventual Sem Teto");
    }
}
