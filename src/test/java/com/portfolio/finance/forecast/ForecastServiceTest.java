package com.portfolio.finance.forecast;

import com.portfolio.finance.account.Account;
import com.portfolio.finance.account.AccountRepository;
import com.portfolio.finance.category.Category;
import com.portfolio.finance.category.CategoryRepository;
import com.portfolio.finance.forecast.dto.ForecastResponse;
import com.portfolio.finance.forecast.dto.MitigationPlanDto;
import com.portfolio.finance.forecast.dto.MitigationPlanRequest;
import com.portfolio.finance.forecast.dto.RiskFactorCreateRequest;
import com.portfolio.finance.forecast.dto.RiskFactorDto;
import com.portfolio.finance.transaction.Transaction;
import com.portfolio.finance.transaction.TransactionRepository;
import com.portfolio.finance.transaction.TransactionStatus;
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
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Regras e Cálculos Determinísticos de Previsões e Riscos")
class ForecastServiceTest {

    private static final Long USER_ID = 1L;

    @Mock
    private RiskFactorRepository riskFactorRepository;
    @Mock
    private MitigationPlanRepository mitigationPlanRepository;
    @Mock
    private TransactionRepository transactionRepository;
    @Mock
    private CategoryRepository categoryRepository;
    @Mock
    private AccountRepository accountRepository;
    @Mock
    private UserRepository userRepository;

    private ForecastService forecastService;

    @BeforeEach
    void setUp() {
        forecastService = new ForecastService(
                riskFactorRepository,
                mitigationPlanRepository,
                transactionRepository,
                categoryRepository,
                accountRepository,
                userRepository
        );
    }

    @Test
    @DisplayName("Cálculo determinístico de Previsão T2, acurácia, cobertura e detecção de riscos por regra")
    void getForecastCalculatesDeterministicKpisAndDetectsRisks() {
        User user = new User("Admin", "admin@email.com", "hash");
        ReflectionTestUtils.setField(user, "id", USER_ID);

        Category cat1 = new Category("Infraestrutura Cloud", "chart-1", new BigDecimal("4000.00"), "VARIABLE", user);
        Category cat2 = new Category("Locação Comercial", "chart-2", new BigDecimal("5000.00"), "FIXED", user);
        ReflectionTestUtils.setField(cat1, "id", 1L);
        ReflectionTestUtils.setField(cat2, "id", 2L);

        when(categoryRepository.findAllByUserIdOrderByNameAsc(USER_ID)).thenReturn(List.of(cat1, cat2));

        LocalDate refDate = LocalDate.of(2026, 10, 15);
        // Gasto no mês de referência (Out/2026): 3600 em cat1 e 5000 em cat2 + 1200 pendente = 9800
        Transaction t1 = new Transaction("AWS Cloud", new BigDecimal("3600.00"), refDate, TransactionType.EXPENSE, cat1, user);
        Transaction t2 = new Transaction("Aluguel Sede", new BigDecimal("5000.00"), refDate, TransactionType.EXPENSE, cat2, user);
        Transaction tOpen = new Transaction("Fatura Manutenção", new BigDecimal("1200.00"), refDate.plusDays(5), TransactionType.EXPENSE, cat1, user);
        ReflectionTestUtils.setField(tOpen, "status", TransactionStatus.PENDING);

        when(transactionRepository.findAllByUserIdOrderByDateDesc(USER_ID)).thenReturn(List.of(tOpen, t1, t2));

        Account acc = new Account(user, "Conta Principal", "Financeiro", "Tier 1", "São Paulo", "SP", new BigDecimal("40000.00"), null);
        when(accountRepository.findAllByUserIdAndArchivedAtIsNullOrderByIdAsc(USER_ID)).thenReturn(List.of(acc));
        when(riskFactorRepository.findAllByUserIdAndStatusOrderByCreatedAtDesc(USER_ID, "ACTIVE")).thenReturn(List.of());

        ForecastResponse response = forecastService.getForecast(USER_ID, "T2");

        assertThat(response).isNotNull();
        // Despesa total no mês = 3600 + 5000 + 1200 = 9800
        // Previsão T2 (3 meses) = 9800 * 3 = 29400
        assertThat(response.kpis().forecastT2()).isEqualByComparingTo(new BigDecimal("29400.00"));
        // Teto T2 = (4000 + 5000) * 3 = 27000
        assertThat(response.kpis().forecastT2Ceiling()).isEqualByComparingTo(new BigDecimal("27000.00"));
        // Cobertura em meses = 40000 / 9800 = 4.1 meses
        assertThat(response.kpis().balanceCoverage()).isEqualByComparingTo(new BigDecimal("4.1"));
        // Despesas em aberto = 1200 (tOpen tem status PENDING)
        assertThat(response.kpis().openExpensesAmount()).isEqualByComparingTo(new BigDecimal("1200.00"));
        assertThat(response.kpis().openExpensesCount()).isEqualTo(1L);

        // Deve ter detectado risco em cat1 (4800 de 4000 = 120% >= 80%) e risco de faturas em aberto
        assertThat(response.riskFactors()).hasSizeGreaterThanOrEqualTo(2);
        boolean foundCat1Risk = response.riskFactors().stream()
                .anyMatch(r -> r.title().contains("Infraestrutura Cloud") && "high".equalsIgnoreCase(r.severity()));
        assertThat(foundCat1Risk).isTrue();
    }

    @Test
    @DisplayName("B2 & B3: Sem despesas retorna balanceCoverage = null (sem fallback de R$ 1.000) e lista vazia sem dados")
    void getForecastReturnsNullCoverageWhenNoExpensesAndEmptyProjectionWhenNoTransactions() {
        User user = new User("Admin", "admin@email.com", "hash");
        ReflectionTestUtils.setField(user, "id", USER_ID);

        Account acc = new Account(user, "Conta Principal", "Banco", "Principal", "São Paulo", "SP", new BigDecimal("845000.00"), null);
        when(categoryRepository.findAllByUserIdOrderByNameAsc(USER_ID)).thenReturn(List.of());
        when(transactionRepository.findAllByUserIdOrderByDateDesc(USER_ID)).thenReturn(List.of());
        when(accountRepository.findAllByUserIdAndArchivedAtIsNullOrderByIdAsc(USER_ID)).thenReturn(List.of(acc));
        when(riskFactorRepository.findAllByUserIdAndStatusOrderByCreatedAtDesc(USER_ID, "ACTIVE")).thenReturn(List.of());

        ForecastResponse response = forecastService.getForecast(USER_ID, "T2");

        assertThat(response.kpis().balanceCoverage()).isNull();
        assertThat(response.projectionChart()).isEmpty();
        assertThat(response.quarterlyForecast()).isEmpty();
        assertThat(response.scenarios()).isEmpty();
    }

    @Test
    @DisplayName("B1 & B2: Cobertura de saldo em meses usa média mensal de despesas dos até 3 meses encerrados no período de referência")
    void getForecastCalculatesCoverageInMonthsOverThreeMonthsWindow() {
        User user = new User("Admin", "admin@email.com", "hash");
        ReflectionTestUtils.setField(user, "id", USER_ID);

        Category cat = new Category("Operações", "chart-1", new BigDecimal("15000.00"), "VARIABLE", user);
        ReflectionTestUtils.setField(cat, "id", 1L);

        // Despesas nos 3 meses encerrados em Out/2026: Ago = 8.000, Set = 10.000, Out = 12.000 -> média = 10.000/mês
        Transaction expAug = new Transaction("Ago", new BigDecimal("8000.00"), LocalDate.of(2026, 8, 10), TransactionType.EXPENSE, cat, user);
        Transaction expSep = new Transaction("Set", new BigDecimal("10000.00"), LocalDate.of(2026, 9, 10), TransactionType.EXPENSE, cat, user);
        Transaction expOct = new Transaction("Out", new BigDecimal("12000.00"), LocalDate.of(2026, 10, 10), TransactionType.EXPENSE, cat, user);

        Account acc = new Account(user, "Conta Principal", "Banco", "Principal", "São Paulo", "SP", new BigDecimal("35000.00"), null);

        when(categoryRepository.findAllByUserIdOrderByNameAsc(USER_ID)).thenReturn(List.of(cat));
        when(transactionRepository.findAllByUserIdOrderByDateDesc(USER_ID)).thenReturn(List.of(expOct, expSep, expAug));
        when(accountRepository.findAllByUserIdAndArchivedAtIsNullOrderByIdAsc(USER_ID)).thenReturn(List.of(acc));
        when(riskFactorRepository.findAllByUserIdAndStatusOrderByCreatedAtDesc(USER_ID, "ACTIVE")).thenReturn(List.of());

        ForecastResponse response = forecastService.getForecast(USER_ID, "T2");

        // Saldo = 35.000 ÷ média mensal (10.000) = 3.5 meses
        assertThat(response.kpis().balanceCoverage()).isEqualByComparingTo(new BigDecimal("3.5"));
        // Período de referência automático = Out/2026 (gasto do mês = 12.000 -> T2 = 36.000)
        assertThat(response.kpis().forecastT2()).isEqualByComparingTo(new BigDecimal("36000.00"));
        assertThat(response.projectionChart()).hasSize(3);
    }

    @Test
    @DisplayName("Criar fator de risco manual persiste entidade associada ao usuário")
    void createManualRiskPersistsEntity() {
        User user = new User("Admin", "admin@email.com", "hash");
        ReflectionTestUtils.setField(user, "id", USER_ID);
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));

        RiskFactor mockSaved = new RiskFactor(user, "Alta de Câmbio Dólar", "Operações", "high", new BigDecimal("5000.00"), "Impacto em SaaS", "MANUAL");
        ReflectionTestUtils.setField(mockSaved, "id", 10L);
        when(riskFactorRepository.save(any(RiskFactor.class))).thenReturn(mockSaved);

        RiskFactorCreateRequest request = new RiskFactorCreateRequest(
                "Alta de Câmbio Dólar",
                "Operações",
                "high",
                new BigDecimal("5000.00"),
                "Impacto em SaaS",
                List.of("AWS Cloud")
        );

        RiskFactorDto dto = forecastService.createManualRisk(request, USER_ID);

        assertThat(dto).isNotNull();
        assertThat(dto.key()).isEqualTo("manual:10");
        assertThat(dto.title()).isEqualTo("Alta de Câmbio Dólar");
        assertThat(dto.estimatedAmount()).isEqualByComparingTo(new BigDecimal("5000.00"));
        assertThat(dto.origin()).isEqualTo("MANUAL");
    }

    @Test
    @DisplayName("Salvar plano de mitigação cria ou atualiza dados com sugestões baseadas em regras determinísticas")
    void saveMitigationPlanPersistsAndReturnsRuleDetails() {
        User user = new User("Admin", "admin@email.com", "hash");
        ReflectionTestUtils.setField(user, "id", USER_ID);
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));

        String riskKey = "auto:category:2";
        when(mitigationPlanRepository.findByUserIdAndRiskKey(USER_ID, riskKey)).thenReturn(Optional.empty());

        MitigationPlan mockPlan = new MitigationPlan(user, riskKey, "Renegociar contrato", "Carlos Gestor", LocalDate.now().plusDays(10), "IN_PROGRESS", "Regra Teto Alto");
        ReflectionTestUtils.setField(mockPlan, "id", 5L);
        when(mitigationPlanRepository.save(any(MitigationPlan.class))).thenReturn(mockPlan);

        MitigationPlanRequest request = new MitigationPlanRequest(
                "Renegociar contrato",
                "Carlos Gestor",
                LocalDate.now().plusDays(10),
                "IN_PROGRESS"
        );

        MitigationPlanDto result = forecastService.saveMitigationPlan(riskKey, request, USER_ID);

        assertThat(result).isNotNull();
        assertThat(result.actions()).isEqualTo("Renegociar contrato");
        assertThat(result.owner()).isEqualTo("Carlos Gestor");
        assertThat(result.ruleSuggestions()).isNotEmpty();
    }
}
