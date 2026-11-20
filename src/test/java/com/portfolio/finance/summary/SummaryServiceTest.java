package com.portfolio.finance.summary;

import com.portfolio.finance.exception.BusinessException;
import com.portfolio.finance.summary.dto.MonthlySummaryResponse;
import com.portfolio.finance.transaction.TransactionRepository;
import com.portfolio.finance.transaction.TransactionType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Regra 4: saldo não pode ser calculado sem ao menos um lançamento")
class SummaryServiceTest {

    private static final Long USER_ID = 1L;

    @Mock
    private TransactionRepository transactionRepository;

    private SummaryService service;

    @BeforeEach
    void setUp() {
        service = new SummaryService(transactionRepository);
    }

    @Test
    void throwsBusinessErrorWhenUserHasNoTransactions() {
        when(transactionRepository.existsByUserId(USER_ID)).thenReturn(false);

        assertThatThrownBy(() -> service.monthly(USER_ID, 2026, 10))
                .isInstanceOf(BusinessException.class)
                .hasMessage(SummaryService.NO_TRANSACTIONS_MESSAGE);

        verify(transactionRepository, never()).sumByTypeAndPeriod(anyLong(), any(), any(), any());
    }

    @Test
    void calculatesTotalsAndBalanceWhenUserHasTransactions() {
        LocalDate start = LocalDate.of(2026, 10, 1);
        LocalDate end = LocalDate.of(2026, 10, 31);
        when(transactionRepository.existsByUserId(USER_ID)).thenReturn(true);
        when(transactionRepository.sumByTypeAndPeriod(USER_ID, TransactionType.INCOME, start, end))
                .thenReturn(new BigDecimal("5000.00"));
        when(transactionRepository.sumByTypeAndPeriod(USER_ID, TransactionType.EXPENSE, start, end))
                .thenReturn(new BigDecimal("1234.56"));

        MonthlySummaryResponse summary = service.monthly(USER_ID, 2026, 10);

        assertThat(summary.totalIncome()).isEqualByComparingTo("5000.00");
        assertThat(summary.totalExpense()).isEqualByComparingTo("1234.56");
        assertThat(summary.balance()).isEqualByComparingTo("3765.44");
    }

    @Test
    void returnsZeroedSummaryForMonthWithoutTransactionsWhenUserHasOthers() {
        when(transactionRepository.existsByUserId(USER_ID)).thenReturn(true);
        when(transactionRepository.sumByTypeAndPeriod(anyLong(), any(), any(), any())).thenReturn(BigDecimal.ZERO);

        MonthlySummaryResponse summary = service.monthly(USER_ID, 2020, 2);

        assertThat(summary.balance()).isEqualByComparingTo("0");
    }
}
