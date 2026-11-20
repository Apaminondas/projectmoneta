package com.portfolio.finance.summary;

import com.portfolio.finance.exception.BusinessException;
import com.portfolio.finance.exception.InvalidValueException;
import com.portfolio.finance.summary.dto.CategoryReportResponse;
import com.portfolio.finance.summary.dto.MonthlySummaryResponse;
import com.portfolio.finance.transaction.CategoryTypeTotal;
import com.portfolio.finance.transaction.TransactionRepository;
import com.portfolio.finance.transaction.TransactionType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class SummaryService {

    static final String NO_TRANSACTIONS_MESSAGE =
            "Não é possível calcular o saldo: nenhum lançamento cadastrado. "
                    + "Cadastre ao menos uma receita ou despesa.";

    private final TransactionRepository transactionRepository;

    public SummaryService(TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    /**
     * Resumo do mês: total de entradas, total de saídas e saldo.
     * Regra 4: o saldo não é calculado se o usuário não possuir nenhum lançamento (422).
     */
    @Transactional(readOnly = true)
    public MonthlySummaryResponse monthly(Long userId, int year, int month) {
        if (!transactionRepository.existsByUserId(userId)) {
            throw new BusinessException(NO_TRANSACTIONS_MESSAGE);
        }

        YearMonth period = YearMonth.of(year, month);
        LocalDate start = period.atDay(1);
        LocalDate end = period.atEndOfMonth();

        BigDecimal income = transactionRepository.sumByTypeAndPeriod(userId, TransactionType.INCOME, start, end);
        BigDecimal expense = transactionRepository.sumByTypeAndPeriod(userId, TransactionType.EXPENSE, start, end);

        return new MonthlySummaryResponse(year, month, income, expense, income.subtract(expense));
    }

    /**
     * Totais de entradas e saídas agrupados por categoria, no período informado (opcional).
     */
    @Transactional(readOnly = true)
    public CategoryReportResponse byCategory(Long userId, LocalDate startDate, LocalDate endDate) {
        if (startDate != null && endDate != null && startDate.isAfter(endDate)) {
            throw new InvalidValueException("startDate", "startDate não pode ser posterior a endDate");
        }

        List<CategoryTypeTotal> rows = transactionRepository.sumByCategoryAndType(userId, startDate, endDate);

        Map<Long, CategoryAccumulator> byCategory = new LinkedHashMap<>();
        for (CategoryTypeTotal row : rows) {
            byCategory.computeIfAbsent(row.categoryId(), id -> new CategoryAccumulator(id, row.categoryName()))
                    .add(row.type(), row.total());
        }

        List<CategoryReportResponse.CategoryTotal> categories = byCategory.values().stream()
                .map(CategoryAccumulator::toResponse)
                .sorted(Comparator.comparing(CategoryReportResponse.CategoryTotal::categoryName,
                        String.CASE_INSENSITIVE_ORDER))
                .toList();

        BigDecimal totalIncome = categories.stream()
                .map(CategoryReportResponse.CategoryTotal::totalIncome)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalExpense = categories.stream()
                .map(CategoryReportResponse.CategoryTotal::totalExpense)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new CategoryReportResponse(startDate, endDate, totalIncome, totalExpense, categories);
    }

    private static final class CategoryAccumulator {
        private final Long id;
        private final String name;
        private BigDecimal income = BigDecimal.ZERO;
        private BigDecimal expense = BigDecimal.ZERO;

        private CategoryAccumulator(Long id, String name) {
            this.id = id;
            this.name = name;
        }

        private void add(TransactionType type, BigDecimal value) {
            if (type == TransactionType.INCOME) {
                income = income.add(value);
            } else {
                expense = expense.add(value);
            }
        }

        private CategoryReportResponse.CategoryTotal toResponse() {
            return new CategoryReportResponse.CategoryTotal(id, name, income, expense);
        }
    }
}
