package com.portfolio.finance.account;

import com.portfolio.finance.account.dto.AccountRequest;
import com.portfolio.finance.account.dto.AccountResponse;
import com.portfolio.finance.account.dto.AccountSummaryResponse;
import com.portfolio.finance.account.dto.AppointmentRequest;
import com.portfolio.finance.account.dto.AppointmentResponse;
import com.portfolio.finance.account.dto.ContactRequest;
import com.portfolio.finance.category.Category;
import com.portfolio.finance.exception.ResourceNotFoundException;
import com.portfolio.finance.transaction.Transaction;
import com.portfolio.finance.transaction.TransactionRepository;
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
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Regra de Isolamento e Lógica de Negócio para Contas e Compromissos")
class AccountServiceTest {

    private static final Long USER_ID = 1L;
    private static final Long OTHER_USER_ID = 999L;

    @Mock
    private AccountRepository accountRepository;
    @Mock
    private ContactRepository contactRepository;
    @Mock
    private AppointmentRepository appointmentRepository;
    @Mock
    private TransactionRepository transactionRepository;
    @Mock
    private UserRepository userRepository;

    private AccountService service;

    @BeforeEach
    void setUp() {
        service = new AccountService(accountRepository, contactRepository, appointmentRepository,
                transactionRepository, userRepository);
    }

    @Test
    @DisplayName("Conta de outro usuário resulta em ResourceNotFoundException (404 anti-enumeração)")
    void getAccountOfAnotherUserThrowsNotFound() {
        when(accountRepository.findByIdAndUserId(10L, OTHER_USER_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getAccount(10L, OTHER_USER_ID))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("Arquivamento de conta aplica soft delete com sucesso")
    void archiveAccountSuccess() {
        User user = new User("João", "joao@email.com", "hash");
        Account account = new Account(user, "Conta Teste", "Tech", "Principal", "SP", "SP",
                new BigDecimal("1000.00"), null);

        when(accountRepository.findByIdAndUserId(5L, USER_ID)).thenReturn(Optional.of(account));

        service.archiveAccount(5L, USER_ID);

        assertThat(account.isArchived()).isTrue();
        assertThat(account.getArchivedAt()).isNotNull();
    }

    @Test
    @DisplayName("Cálculo determinístico de KPIs de Contas sem números inventados")
    void getSummaryCalculatesDeterministicValues() {
        User user = new User("João", "joao@email.com", "hash");
        Account acc1 = new Account(user, "Conta 1", "Tech", "Principal", "SP", "SP",
                new BigDecimal("10000.00"), null);
        Account acc2 = new Account(user, "Conta 2", "Fin", "Secundária", "RJ", "RJ",
                new BigDecimal("5000.00"), null);
        ReflectionTestUtils.setField(acc1, "id", 1L);
        ReflectionTestUtils.setField(acc2, "id", 2L);

        when(accountRepository.findAllByUserIdAndArchivedAtIsNullOrderByIdAsc(USER_ID))
                .thenReturn(List.of(acc1, acc2));
        when(transactionRepository.findAllByUserIdOrderByDateDesc(USER_ID))
                .thenReturn(List.of());

        AccountSummaryResponse summary = service.getSummary(USER_ID, null, null);

        assertThat(summary.totalAccounts()).isEqualTo(2);
        assertThat(summary.accumulatedBalance()).isEqualByComparingTo(new BigDecimal("15000.00"));
        assertThat(summary.regularityIndex()).isZero();
        assertThat(summary.activeTransactions()).isZero();
        assertThat(summary.formula()).contains("∑(saldo_inicial + receitas - despesas)");
        assertThat(summary.breakdown()).hasSize(2);
    }

    @Test
    @DisplayName("B4: Regularidade geral do resumo é exatamente a média arredondada da regularidade de cada conta nos últimos 6 meses")
    void regularityIndexEqualsRoundedAverageOfAccountsOverSixMonths() {
        User user = new User("João", "joao@email.com", "hash");
        Account acc1 = new Account(user, "Conta Operacional", "Banco", "Principal", "SP", "SP",
                new BigDecimal("10000.00"), null);
        Account acc2 = new Account(user, "Conta Reserva", "Banco", "Reserva", "SP", "SP",
                new BigDecimal("5000.00"), null);
        ReflectionTestUtils.setField(acc1, "id", 1L);
        ReflectionTestUtils.setField(acc2, "id", 2L);

        Category cat = new Category("Operações", "chart-1", new BigDecimal("5000.00"), "VARIABLE", user);

        // Período de referência mais recente com dados: Out/2026 (2026-10)
        // Janela de 6 meses: Mai/2026 a Out/2026
        // acc1 ativa em 6 dos 6 meses -> 100%
        // acc2 ativa em 3 dos 6 meses (Ago, Set, Out) -> 50%
        // Média arredondada esperada = round((100 + 50) / 2.0) = 75%
        Transaction t1 = txForAccount(user, cat, acc1, LocalDate.of(2026, 10, 15));
        Transaction t2 = txForAccount(user, cat, acc1, LocalDate.of(2026, 9, 15));
        Transaction t3 = txForAccount(user, cat, acc1, LocalDate.of(2026, 8, 15));
        Transaction t4 = txForAccount(user, cat, acc1, LocalDate.of(2026, 7, 15));
        Transaction t5 = txForAccount(user, cat, acc1, LocalDate.of(2026, 6, 15));
        Transaction t6 = txForAccount(user, cat, acc1, LocalDate.of(2026, 5, 15));

        Transaction t7 = txForAccount(user, cat, acc2, LocalDate.of(2026, 10, 10));
        Transaction t8 = txForAccount(user, cat, acc2, LocalDate.of(2026, 9, 10));
        Transaction t9 = txForAccount(user, cat, acc2, LocalDate.of(2026, 8, 10));
        // Lançamento fora da janela de 6 meses (Jan/2026) não deve inflar a regularidade
        Transaction tOld = txForAccount(user, cat, acc2, LocalDate.of(2026, 1, 10));

        List<Transaction> allTxs = List.of(t1, t7, t2, t8, t3, t9, t4, t5, t6, tOld);

        when(accountRepository.findAllByUserIdAndArchivedAtIsNullOrderByIdAsc(USER_ID))
                .thenReturn(List.of(acc1, acc2));
        when(transactionRepository.findAllByUserIdOrderByDateDesc(USER_ID))
                .thenReturn(allTxs);
        when(transactionRepository.findLatestDateByUserId(USER_ID))
                .thenReturn(Optional.of(LocalDate.of(2026, 10, 15)));

        List<AccountResponse> accountList = service.listAccounts(USER_ID, null, null, false);
        AccountSummaryResponse summary = service.getSummary(USER_ID, null, null);

        assertThat(accountList).hasSize(2);
        assertThat(accountList.get(0).regularityPct()).isEqualTo(100);
        assertThat(accountList.get(1).regularityPct()).isEqualTo(50);

        int expectedAvg = (int) Math.round(
                accountList.stream().mapToInt(AccountResponse::regularityPct).average().orElse(0)
        );
        assertThat(summary.regularityIndex()).isEqualTo(expectedAvg).isEqualTo(75);
    }

    private Transaction txForAccount(User user, Category cat, Account account, LocalDate date) {
        Transaction tx = new Transaction("Lançamento", new BigDecimal("100.00"), date, TransactionType.EXPENSE, cat, user);
        tx.setAccount(account);
        return tx;
    }

    @Test
    @DisplayName("Criação de compromisso vincula à conta e ao usuário")
    void createAppointmentSuccess() {
        User user = new User("João", "joao@email.com", "hash");
        Account account = new Account(user, "Conta Teste", "Tech", "Principal", "SP", "SP",
                BigDecimal.ZERO, null);

        when(accountRepository.findByIdAndUserId(1L, USER_ID)).thenReturn(Optional.of(account));
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(inv -> inv.getArgument(0));

        AppointmentRequest request = new AppointmentRequest("Reunião Trimestral",
                LocalDateTime.now().plusDays(2), "Revisar contrato");

        AppointmentResponse response = service.createAppointment(1L, request, USER_ID);

        assertThat(response.title()).isEqualTo("Reunião Trimestral");
        assertThat(response.note()).isEqualTo("Revisar contrato");
    }
}
