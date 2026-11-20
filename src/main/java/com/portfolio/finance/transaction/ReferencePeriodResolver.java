package com.portfolio.finance.transaction;

import com.portfolio.finance.exception.InvalidValueException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

/**
 * Resolve o período de referência (ano, mês) de forma consistente entre serviços:
 * 1. Usa {@code year}/{@code month} se informados na requisição;
 * 2. Senão, usa o mês mais recente que possua ao menos um lançamento do usuário autenticado;
 * 3. Se não houver nenhum lançamento para o usuário, usa o mês atual do relógio do sistema.
 */
@Component
public class ReferencePeriodResolver {

    private final TransactionRepository transactionRepository;
    private final Clock clock;

    @Autowired
    public ReferencePeriodResolver(TransactionRepository transactionRepository, Clock clock) {
        this.transactionRepository = transactionRepository;
        this.clock = clock != null ? clock : Clock.systemDefaultZone();
    }

    public ReferencePeriodResolver(TransactionRepository transactionRepository) {
        this(transactionRepository, Clock.systemDefaultZone());
    }

    public YearMonth resolve(Long userId, Integer year, Integer month) {
        if (month != null && (month < 1 || month > 12)) {
            throw new InvalidValueException("month", "month deve estar entre 1 e 12");
        }
        if (year != null && month != null) {
            return YearMonth.of(year, month);
        }

        YearMonth basePeriod = findLatestUserPeriod(userId)
                .orElseGet(() -> YearMonth.now(clock));

        int resolvedYear = year != null ? year : basePeriod.getYear();
        int resolvedMonth = month != null ? month : basePeriod.getMonthValue();
        return YearMonth.of(resolvedYear, resolvedMonth);
    }

    public YearMonth resolve(Long userId) {
        return resolve(userId, null, null);
    }

    private Optional<YearMonth> findLatestUserPeriod(Long userId) {
        Optional<LocalDate> maxDate = transactionRepository.findLatestDateByUserId(userId);
        if (maxDate != null && maxDate.isPresent()) {
            return maxDate.map(YearMonth::from);
        }

        List<Transaction> transactions = transactionRepository.findAllByUserIdOrderByDateDesc(userId);
        if (transactions == null || transactions.isEmpty()) {
            return Optional.empty();
        }

        return transactions.stream()
                .map(Transaction::getDate)
                .filter(d -> d != null)
                .max(Comparator.naturalOrder())
                .map(YearMonth::from);
    }
}

