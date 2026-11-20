package com.portfolio.finance.forecast;

import com.portfolio.finance.account.Account;
import com.portfolio.finance.account.AccountRepository;
import com.portfolio.finance.category.Category;
import com.portfolio.finance.category.CategoryRepository;
import com.portfolio.finance.exception.ResourceNotFoundException;
import com.portfolio.finance.forecast.dto.ForecastKpiDto;
import com.portfolio.finance.forecast.dto.ForecastResponse;
import com.portfolio.finance.forecast.dto.MitigationPlanDto;
import com.portfolio.finance.forecast.dto.MitigationPlanRequest;
import com.portfolio.finance.forecast.dto.ProjectionMonthDto;
import com.portfolio.finance.forecast.dto.QuarterlyForecastDto;
import com.portfolio.finance.forecast.dto.RiskFactorCreateRequest;
import com.portfolio.finance.forecast.dto.RiskFactorDto;
import com.portfolio.finance.forecast.dto.ScenarioDto;
import com.portfolio.finance.transaction.ReferencePeriodResolver;
import com.portfolio.finance.transaction.Transaction;
import com.portfolio.finance.transaction.TransactionRepository;
import com.portfolio.finance.transaction.TransactionStatus;
import com.portfolio.finance.transaction.TransactionType;
import com.portfolio.finance.user.User;
import com.portfolio.finance.user.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class ForecastService {

    private static final String[] MONTH_LABELS = {
            "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
            "Jul", "Ago", "Set", "Out", "Nov", "Dez"
    };

    private final RiskFactorRepository riskFactorRepository;
    private final MitigationPlanRepository mitigationPlanRepository;
    private final TransactionRepository transactionRepository;
    private final CategoryRepository categoryRepository;
    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final ReferencePeriodResolver referencePeriodResolver;

    @Autowired
    public ForecastService(RiskFactorRepository riskFactorRepository,
                           MitigationPlanRepository mitigationPlanRepository,
                           TransactionRepository transactionRepository,
                           CategoryRepository categoryRepository,
                           AccountRepository accountRepository,
                           UserRepository userRepository,
                           ReferencePeriodResolver referencePeriodResolver) {
        this.riskFactorRepository = riskFactorRepository;
        this.mitigationPlanRepository = mitigationPlanRepository;
        this.transactionRepository = transactionRepository;
        this.categoryRepository = categoryRepository;
        this.accountRepository = accountRepository;
        this.userRepository = userRepository;
        this.referencePeriodResolver = referencePeriodResolver;
    }

    public ForecastService(RiskFactorRepository riskFactorRepository,
                           MitigationPlanRepository mitigationPlanRepository,
                           TransactionRepository transactionRepository,
                           CategoryRepository categoryRepository,
                           AccountRepository accountRepository,
                           UserRepository userRepository) {
        this(riskFactorRepository, mitigationPlanRepository, transactionRepository,
                categoryRepository, accountRepository, userRepository,
                new ReferencePeriodResolver(transactionRepository));
    }

    /**
     * Calcula previsões, projeções, cenários e fatores de risco do usuário no período de referência.
     * A cobertura de saldo ({@code balanceCoverage}) é expressa em MESES:
     * {@code saldo atual ÷ média mensal de despesas dos até 3 meses encerrados no período de referência}.
     * Caso não haja despesas no período de até 3 meses ou a média seja zero, retorna {@code null}.
     */
    @Transactional(readOnly = true)
    public ForecastResponse getForecast(Long userId, String timeframe) {
        return getForecast(userId, timeframe, null, null);
    }

    /**
     * Calcula previsões, projeções, cenários e fatores de risco do usuário para o ano/mês informados
     * (ou para o mês mais recente com lançamentos do usuário quando omitidos).
     * Unidade de {@code balanceCoverage}: MESES ({@code null} se não houver despesas).
     */
    @Transactional(readOnly = true)
    public ForecastResponse getForecast(Long userId, String timeframe, Integer year, Integer month) {
        List<Category> categories = categoryRepository.findAllByUserIdOrderByNameAsc(userId);
        List<Transaction> transactions = transactionRepository.findAllByUserIdOrderByDateDesc(userId);
        List<Account> accounts = accountRepository.findAllByUserIdAndArchivedAtIsNullOrderByIdAsc(userId);

        YearMonth refPeriod = referencePeriodResolver.resolve(userId, year, month);
        LocalDate startOfMonth = refPeriod.atDay(1);
        LocalDate endOfMonth = refPeriod.atEndOfMonth();

        // Despesas do mês de referência
        List<Transaction> currentMonthExpenses = transactions.stream()
                .filter(t -> t.getType() == TransactionType.EXPENSE)
                .filter(t -> !t.getDate().isBefore(startOfMonth) && !t.getDate().isAfter(endOfMonth))
                .toList();

        BigDecimal monthlySpent = currentMonthExpenses.stream()
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Soma dos tetos mensais de todas as categorias
        BigDecimal totalMonthlyCeiling = categories.stream()
                .map(c -> c.getMonthlyCeiling() != null ? c.getMonthlyCeiling() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Previsão Trimestre T2 = Gasto mensal projetado para 3 meses
        BigDecimal forecastT2 = monthlySpent.multiply(BigDecimal.valueOf(3));
        BigDecimal forecastT2Ceiling = totalMonthlyCeiling.multiply(BigDecimal.valueOf(3));

        // Saldo atual das contas ativas (ou saldo líquido dos lançamentos se não houver contas cadastradas)
        BigDecimal totalBalance;
        if (!accounts.isEmpty()) {
            totalBalance = accounts.stream()
                    .map(Account::getOpeningBalance)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        } else {
            totalBalance = transactions.stream()
                    .filter(t -> !t.getDate().isAfter(endOfMonth))
                    .map(t -> t.getType() == TransactionType.INCOME ? t.getAmount() : t.getAmount().negate())
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        }

        // B2: Cobertura de saldo em MESES = saldo atual ÷ média mensal de despesas dos até 3 meses encerrados no período de referência
        YearMonth threeMonthsStart = refPeriod.minusMonths(2);
        Map<YearMonth, BigDecimal> expensesByMonthInWindow = transactions.stream()
                .filter(t -> t.getType() == TransactionType.EXPENSE)
                .filter(t -> {
                    YearMonth ym = YearMonth.from(t.getDate());
                    return !ym.isBefore(threeMonthsStart) && !ym.isAfter(refPeriod);
                })
                .collect(Collectors.groupingBy(
                        t -> YearMonth.from(t.getDate()),
                        Collectors.reducing(BigDecimal.ZERO, Transaction::getAmount, BigDecimal::add)
                ));

        long monthsWithExpenses = expensesByMonthInWindow.values().stream()
                .filter(v -> v.compareTo(BigDecimal.ZERO) > 0)
                .count();
        BigDecimal totalWindowExpenses = expensesByMonthInWindow.values().stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal avgMonthlyExpense = null;
        BigDecimal balanceCoverage = null;
        if (monthsWithExpenses > 0 && totalWindowExpenses.compareTo(BigDecimal.ZERO) > 0) {
            avgMonthlyExpense = totalWindowExpenses.divide(BigDecimal.valueOf(monthsWithExpenses), 6, RoundingMode.HALF_UP);
            if (avgMonthlyExpense.compareTo(BigDecimal.ZERO) > 0) {
                balanceCoverage = totalBalance.divide(avgMonthlyExpense, 1, RoundingMode.HALF_UP);
            }
        }

        // Despesas em aberto (PENDING ou com data posterior ao início do mês de referência)
        List<Transaction> openExpenses = transactions.stream()
                .filter(t -> t.getType() == TransactionType.EXPENSE)
                .filter(t -> t.getStatus() == TransactionStatus.PENDING || t.getDate().isAfter(endOfMonth))
                .toList();

        BigDecimal openExpensesAmount = openExpenses.stream()
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Acurácia histórica: aderência aos tetos (sem valor sintético quando não há dados)
        Integer accuracyPct = 0;
        if (totalMonthlyCeiling.compareTo(BigDecimal.ZERO) > 0 && monthlySpent.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal diff = totalMonthlyCeiling.subtract(monthlySpent).abs();
            int diffPct = diff.multiply(BigDecimal.valueOf(100)).divide(totalMonthlyCeiling, 0, RoundingMode.HALF_UP).intValue();
            accuracyPct = Math.max(0, Math.min(100, 100 - diffPct / 2));
        }

        Map<String, String> formulas = new HashMap<>();
        formulas.put("forecastT2", "Previsão T2 = gasto mensal consolidado dos lançamentos reais x 3 meses (Teto T2 = soma dos tetos das categorias x 3).");
        formulas.put("accuracy", "Acurácia Histórica = 100 - (|teto_total - gasto_real| / teto_total * 50)% de aderência média.");
        formulas.put("coverage", "Cobertura de Saldo (meses) = saldo atual ÷ média mensal de despesas dos até 3 meses encerrados no período de referência.");
        formulas.put("openExpenses", "Despesas em Aberto = ∑(despesas com status PENDING ou data futura no período).");

        ForecastKpiDto kpis = new ForecastKpiDto(
                forecastT2,
                forecastT2Ceiling,
                accuracyPct,
                balanceCoverage,
                openExpensesAmount,
                (long) openExpenses.size(),
                formulas
        );

        // Fatores de Risco (Automáticos + Manuais)
        List<RiskFactorDto> riskFactorsList = new ArrayList<>();

        // Regra Automática 1: Categorias próximas ao teto (>= 80%)
        for (Category cat : categories) {
            if (cat.getMonthlyCeiling() != null && cat.getMonthlyCeiling().compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal catSpent = currentMonthExpenses.stream()
                        .filter(t -> t.getCategory() != null && t.getCategory().getId() != null && t.getCategory().getId().equals(cat.getId()))
                        .map(Transaction::getAmount)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                int pct = catSpent.multiply(BigDecimal.valueOf(100))
                        .divide(cat.getMonthlyCeiling(), 0, RoundingMode.HALF_UP)
                        .intValue();

                if (pct >= 80) {
                    riskFactorsList.add(new RiskFactorDto(
                            "auto:category:" + cat.getId(),
                            cat.getId(),
                            "Atenção ao Teto: " + cat.getName(),
                            cat.getName(),
                            pct >= 100 ? "high" : "medium",
                            catSpent.subtract(cat.getMonthlyCeiling()).max(BigDecimal.ZERO),
                            "Consumo de " + pct + "% do budget mensal estipulado de R$ " + cat.getMonthlyCeiling(),
                            "AUTOMATIC",
                            List.of(cat.getName() + " - Lançamentos Ativos"),
                            endOfMonth
                    ));
                }
            }
        }

        // Regra Automática 2: Contratos / Despesas em aberto
        if (!openExpenses.isEmpty()) {
            List<String> deals = openExpenses.stream().map(Transaction::getDescription).limit(3).toList();
            riskFactorsList.add(new RiskFactorDto(
                    "auto:open-expenses",
                    0L,
                    "Contratos e Faturas a Vencer no Mês",
                    "Geral",
                    "high",
                    openExpensesAmount,
                    openExpenses.size() + " despesas operacionais com vencimento ou liquidação pendente",
                    "AUTOMATIC",
                    deals,
                    endOfMonth
            ));
        }

        // Riscos Manuais cadastrados pelo usuário no banco
        List<RiskFactor> manualRisks = riskFactorRepository.findAllByUserIdAndStatusOrderByCreatedAtDesc(userId, "ACTIVE");
        for (RiskFactor mr : manualRisks) {
            riskFactorsList.add(new RiskFactorDto(
                    "manual:" + mr.getId(),
                    mr.getId(),
                    mr.getTitle(),
                    mr.getCategory() != null ? mr.getCategory() : "Geral",
                    mr.getSeverity(),
                    mr.getEstimatedAmount(),
                    mr.getDescription(),
                    "MANUAL",
                    List.of("Risco manual inserido pela gestão"),
                    endOfMonth.plusMonths(1)
            ));
        }

        // B3: Projeção Mensal calculada somente com transações reais (lista vazia se não houver dados)
        BigDecimal projectedMonthly = avgMonthlyExpense != null
                ? avgMonthlyExpense.setScale(2, RoundingMode.HALF_UP)
                : monthlySpent.setScale(2, RoundingMode.HALF_UP);
        List<ProjectionMonthDto> projectionChart = buildProjectionChart(
                transactions, refPeriod, projectedMonthly, totalMonthlyCeiling);

        // Previsão Trimestral baseada nos dados reais do ano de referência
        List<QuarterlyForecastDto> quarterlyForecast = buildQuarterlyForecast(
                transactions, refPeriod.getYear(), projectedMonthly.multiply(BigDecimal.valueOf(3)), forecastT2Ceiling);

        // Cenários (vazio se não houver despesas reais)
        List<ScenarioDto> scenarios;
        if (projectedMonthly.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal baseScenario = projectedMonthly.multiply(BigDecimal.valueOf(6));
            scenarios = List.of(
                    new ScenarioDto("Conservador", 85, baseScenario.multiply(BigDecimal.valueOf(0.85)).setScale(2, RoundingMode.HALF_UP), "chart-4"),
                    new ScenarioDto("Caso Base", 65, baseScenario.setScale(2, RoundingMode.HALF_UP), "accent"),
                    new ScenarioDto("Otimista", 40, baseScenario.multiply(BigDecimal.valueOf(1.15)).setScale(2, RoundingMode.HALF_UP), "chart-1")
            );
        } else {
            scenarios = List.of();
        }

        String methodology = "Metodologia: Média mensal real dos lançamentos históricos do usuário nos até 3 meses encerrados no período de referência, confrontada com o teto mensal real dos centros de custo.";

        return new ForecastResponse(kpis, projectionChart, quarterlyForecast, scenarios, riskFactorsList, methodology);
    }

    private List<ProjectionMonthDto> buildProjectionChart(List<Transaction> transactions,
                                                          YearMonth refPeriod,
                                                          BigDecimal projectedMonthly,
                                                          BigDecimal totalCeiling) {
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

        Map<YearMonth, BigDecimal> expensesByMonth = transactions.stream()
                .filter(t -> t.getType() == TransactionType.EXPENSE)
                .collect(Collectors.groupingBy(
                        t -> YearMonth.from(t.getDate()),
                        Collectors.reducing(BigDecimal.ZERO, Transaction::getAmount, BigDecimal::add)
                ));

        List<ProjectionMonthDto> list = new ArrayList<>();
        YearMonth cursor = startMonth;
        while (!cursor.isAfter(refPeriod)) {
            BigDecimal rawActual = expensesByMonth.get(cursor);
            BigDecimal actual = rawActual != null && rawActual.compareTo(BigDecimal.ZERO) > 0
                    ? rawActual.setScale(2, RoundingMode.HALF_UP)
                    : null;
            String label = MONTH_LABELS[cursor.getMonthValue() - 1];
            list.add(new ProjectionMonthDto(label, actual, projectedMonthly, totalCeiling));
            cursor = cursor.plusMonths(1);
        }
        return list;
    }

    private List<QuarterlyForecastDto> buildQuarterlyForecast(List<Transaction> transactions,
                                                              int referenceYear,
                                                              BigDecimal quarterlyProjected,
                                                              BigDecimal quarterlyCeiling) {
        if (transactions == null || transactions.isEmpty()) {
            return List.of();
        }

        List<QuarterlyForecastDto> quarters = new ArrayList<>();
        for (int q = 1; q <= 4; q++) {
            int startM = (q - 1) * 3 + 1;
            int endM = q * 3;
            LocalDate qStart = LocalDate.of(referenceYear, startM, 1);
            LocalDate qEnd = YearMonth.of(referenceYear, endM).atEndOfMonth();

            BigDecimal qActual = transactions.stream()
                    .filter(t -> t.getType() == TransactionType.EXPENSE)
                    .filter(t -> !t.getDate().isBefore(qStart) && !t.getDate().isAfter(qEnd))
                    .map(Transaction::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .setScale(2, RoundingMode.HALF_UP);

            quarters.add(new QuarterlyForecastDto("T" + q, qActual, quarterlyProjected, quarterlyCeiling));
        }
        return quarters;
    }

    public RiskFactorDto createManualRisk(RiskFactorCreateRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário", userId));

        RiskFactor risk = new RiskFactor(
                user,
                request.title().trim(),
                request.category(),
                request.severity(),
                request.estimatedAmount(),
                request.description(),
                "MANUAL"
        );
        risk = riskFactorRepository.save(risk);

        return new RiskFactorDto(
                "manual:" + risk.getId(),
                risk.getId(),
                risk.getTitle(),
                risk.getCategory(),
                risk.getSeverity(),
                risk.getEstimatedAmount(),
                risk.getDescription(),
                "MANUAL",
                request.relatedDeals() != null ? request.relatedDeals() : List.of(),
                LocalDate.now().plusMonths(1)
        );
    }

    @Transactional(readOnly = true)
    public MitigationPlanDto getMitigationPlan(String riskKey, Long userId) {
        MitigationPlan plan = mitigationPlanRepository.findByUserIdAndRiskKey(userId, riskKey).orElse(null);

        List<String> suggestions = generateRuleSuggestions(riskKey);
        String reason = generateRuleReason(riskKey);

        if (plan != null) {
            return new MitigationPlanDto(
                    plan.getId(),
                    plan.getRiskKey(),
                    plan.getActions(),
                    plan.getOwner(),
                    plan.getDueDate(),
                    plan.getStatus(),
                    plan.getRuleReason() != null ? plan.getRuleReason() : reason,
                    suggestions
            );
        }

        return new MitigationPlanDto(
                null,
                riskKey,
                suggestions.isEmpty() ? "" : suggestions.get(0),
                "Diretoria Financeira",
                LocalDate.now().plusDays(15),
                "IN_PROGRESS",
                reason,
                suggestions
        );
    }

    public MitigationPlanDto saveMitigationPlan(String riskKey, MitigationPlanRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário", userId));

        MitigationPlan plan = mitigationPlanRepository.findByUserIdAndRiskKey(userId, riskKey)
                .orElseGet(() -> new MitigationPlan(
                        user,
                        riskKey,
                        request.actions(),
                        request.owner(),
                        request.dueDate(),
                        request.status(),
                        generateRuleReason(riskKey)
                ));

        plan.update(request.actions(), request.owner(), request.dueDate(), request.status());
        plan = mitigationPlanRepository.save(plan);

        return new MitigationPlanDto(
                plan.getId(),
                plan.getRiskKey(),
                plan.getActions(),
                plan.getOwner(),
                plan.getDueDate(),
                plan.getStatus(),
                plan.getRuleReason(),
                generateRuleSuggestions(riskKey)
        );
    }

    private List<String> generateRuleSuggestions(String riskKey) {
        if (riskKey.contains("category:2") || riskKey.toLowerCase().contains("loca")) {
            return List.of(
                    "Regra Teto Alto: Negociar congelamento de índice com a imobiliária administradora.",
                    "Regra Contratual: Antecipar pagamento da fatura para obter desconto de pontualidade."
            );
        }
        if (riskKey.contains("cloud") || riskKey.contains("category:3")) {
            return List.of(
                    "Regra Cloud: Adotar instâncias reservadas (Reserved Instances) para redução de até 30% em custos AWS.",
                    "Regra de Câmbio: Realizar trava de hedge cambial em faturas dolarizadas."
            );
        }
        return List.of(
                "Regra de Budget: Realizar reunião de alinhamento com os responsáveis do centro para contenção de gastos.",
                "Regra de Pagamento: Programar pagamentos com parcelamento sem juros junto ao fornecedor."
        );
    }

    private String generateRuleReason(String riskKey) {
        if (riskKey.startsWith("auto:category:")) {
            return "Detectado automaticamente por regra determinística: Centro de custo ultrapassou 80% do teto mensal estipulado.";
        }
        if (riskKey.startsWith("auto:open-expenses")) {
            return "Detectado automaticamente por regra determinística: Faturas de despesa em aberto com data de vencimento próxima.";
        }
        return "Fator de risco cadastrado manualmente pela liderança financeira.";
    }
}
