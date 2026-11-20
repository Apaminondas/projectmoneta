package com.portfolio.finance.transaction;

import com.portfolio.finance.category.Category;
import com.portfolio.finance.category.CategoryService;
import com.portfolio.finance.exception.BusinessException;
import com.portfolio.finance.exception.InvalidValueException;
import com.portfolio.finance.exception.ResourceNotFoundException;
import com.portfolio.finance.transaction.dto.TransactionRequest;
import com.portfolio.finance.transaction.dto.TransactionResponse;
import com.portfolio.finance.user.User;
import com.portfolio.finance.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TransactionServiceTest {

    private static final Long USER_ID = 1L;
    private static final Long OTHER_USER_ID = 2L;
    private static final Long CATEGORY_ID = 10L;
    private static final LocalDate TODAY = LocalDate.of(2026, 10, 9);

    @Mock
    private TransactionRepository transactionRepository;
    @Mock
    private CategoryService categoryService;
    @Mock
    private UserRepository userRepository;
    @Mock
    private com.portfolio.finance.notification.NotificationService notificationService;

    private TransactionService service;
    private User user;
    private Category category;

    @BeforeEach
    void setUp() {
        Clock fixedClock = Clock.fixed(TODAY.atStartOfDay().toInstant(ZoneOffset.UTC), ZoneId.of("UTC"));
        service = new TransactionService(transactionRepository, categoryService, userRepository, notificationService, fixedClock);
        user = new User("Maria", "maria@email.com", "hash");
        category = new Category("Alimentação", user);
    }

    private static TransactionRequest request(String amount, LocalDate date, TransactionType type) {
        return new TransactionRequest("Teste", new BigDecimal(amount), date, type, CATEGORY_ID);
    }

    private void stubSuccessfulCreate() {
        when(categoryService.findOwned(CATEGORY_ID, USER_ID)).thenReturn(category);
        when(userRepository.getReferenceById(USER_ID)).thenReturn(user);
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void createsTransactionWithFullDetails() {
        stubSuccessfulCreate();
        TransactionRequest detailedRequest = new TransactionRequest(
                "Serviço Freelance", new BigDecimal("3850.00"), TODAY, TransactionType.INCOME,
                CATEGORY_ID, TransactionStatus.PENDING, "PIX", "Desenvolvimento de landing page"
        );

        TransactionResponse created = service.create(detailedRequest, USER_ID);

        assertThat(created.status()).isEqualTo(TransactionStatus.PENDING);
        assertThat(created.paymentMethod()).isEqualTo("PIX");
        assertThat(created.notes()).isEqualTo("Desenvolvimento de landing page");
    }

    @Nested
    @DisplayName("Regra 1: valor nunca pode ser negativo ou zero")
    class NonPositiveAmount {

        @ParameterizedTest(name = "valor {0} é rejeitado na criação")
        @ValueSource(strings = {"0", "0.00", "-0.01", "-150.00"})
        void rejectsNonPositiveAmountOnCreate(String amount) {
            TransactionRequest request = request(amount, TODAY, TransactionType.INCOME);

            assertThatThrownBy(() -> service.create(request, USER_ID))
                    .isInstanceOf(InvalidValueException.class)
                    .hasMessage(TransactionService.NON_POSITIVE_AMOUNT_MESSAGE)
                    .extracting("field").isEqualTo("amount");

            verify(transactionRepository, never()).save(any());
        }

        @Test
        void rejectsNonPositiveAmountOnUpdate() {
            Transaction existing = new Transaction("Antigo", new BigDecimal("10.00"), TODAY,
                    TransactionType.EXPENSE, category, user);
            when(transactionRepository.findByIdAndUserId(5L, USER_ID)).thenReturn(Optional.of(existing));

            assertThatThrownBy(() -> service.update(5L, request("-1", TODAY, TransactionType.EXPENSE), USER_ID))
                    .isInstanceOf(InvalidValueException.class);

            assertThat(existing.getAmount()).isEqualByComparingTo("10.00");
        }

        @Test
        void acceptsSmallestPositiveAmount() {
            stubSuccessfulCreate();

            TransactionResponse response = service.create(request("0.01", TODAY, TransactionType.INCOME), USER_ID);

            assertThat(response.amount()).isEqualByComparingTo("0.01");
        }
    }

    @Nested
    @DisplayName("Regra 2: despesa nunca pode ter data futura (receita pode)")
    class FutureExpense {

        @Test
        void rejectsExpenseWithFutureDate() {
            TransactionRequest request = request("50.00", TODAY.plusDays(1), TransactionType.EXPENSE);

            assertThatThrownBy(() -> service.create(request, USER_ID))
                    .isInstanceOf(BusinessException.class)
                    .hasMessage(TransactionService.FUTURE_EXPENSE_MESSAGE);

            verify(transactionRepository, never()).save(any());
        }

        @Test
        void rejectsUpdatingExpenseToFutureDate() {
            Transaction existing = new Transaction("Aluguel", new BigDecimal("1000.00"), TODAY,
                    TransactionType.EXPENSE, category, user);
            when(transactionRepository.findByIdAndUserId(5L, USER_ID)).thenReturn(Optional.of(existing));

            assertThatThrownBy(() -> service.update(5L,
                    request("1000.00", TODAY.plusMonths(1), TransactionType.EXPENSE), USER_ID))
                    .isInstanceOf(BusinessException.class);

            assertThat(existing.getDate()).isEqualTo(TODAY);
        }

        @Test
        void acceptsExpenseDatedToday() {
            stubSuccessfulCreate();

            TransactionResponse response = service.create(request("50.00", TODAY, TransactionType.EXPENSE), USER_ID);

            assertThat(response.date()).isEqualTo(TODAY);
            assertThat(response.type()).isEqualTo(TransactionType.EXPENSE);
        }

        @Test
        void acceptsIncomeWithFutureDate() {
            stubSuccessfulCreate();

            TransactionResponse response = service.create(
                    request("5000.00", TODAY.plusDays(20), TransactionType.INCOME), USER_ID);

            assertThat(response.date()).isEqualTo(TODAY.plusDays(20));
            assertThat(response.type()).isEqualTo(TransactionType.INCOME);
        }
    }

    @Nested
    @DisplayName("Regra 3: isolamento por usuário (recurso de outro usuário = 404)")
    class UserIsolation {

        @Test
        void getOfAnotherUsersTransactionReturnsNotFound() {
            when(transactionRepository.findByIdAndUserId(99L, OTHER_USER_ID)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.get(99L, OTHER_USER_ID))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        void updateOfAnotherUsersTransactionReturnsNotFound() {
            when(transactionRepository.findByIdAndUserId(99L, OTHER_USER_ID)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.update(99L, request("10", TODAY, TransactionType.INCOME), OTHER_USER_ID))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        void deleteOfAnotherUsersTransactionReturnsNotFoundAndDeletesNothing() {
            when(transactionRepository.findByIdAndUserId(99L, OTHER_USER_ID)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.delete(99L, OTHER_USER_ID))
                    .isInstanceOf(ResourceNotFoundException.class);

            verify(transactionRepository, never()).delete(any(Transaction.class));
        }

        @Test
        void cannotCreateTransactionUsingAnotherUsersCategory() {
            when(categoryService.findOwned(CATEGORY_ID, OTHER_USER_ID))
                    .thenThrow(new ResourceNotFoundException("Categoria", CATEGORY_ID));

            assertThatThrownBy(() -> service.create(request("10", TODAY, TransactionType.INCOME), OTHER_USER_ID))
                    .isInstanceOf(ResourceNotFoundException.class);

            verify(transactionRepository, never()).save(any());
        }
    }
}
