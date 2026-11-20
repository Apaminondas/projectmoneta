package com.portfolio.finance.budget;

import com.portfolio.finance.account.Contact;
import com.portfolio.finance.account.ContactRepository;
import com.portfolio.finance.account.dto.ContactRequest;
import com.portfolio.finance.budget.dto.BudgetResponse;
import com.portfolio.finance.budget.dto.CostCenterDto;
import com.portfolio.finance.budget.dto.CostCenterUpdateRequest;
import com.portfolio.finance.category.Category;
import com.portfolio.finance.category.CategoryRepository;
import com.portfolio.finance.exception.ResourceNotFoundException;
import com.portfolio.finance.transaction.Transaction;
import com.portfolio.finance.transaction.TransactionRepository;
import com.portfolio.finance.transaction.TransactionType;
import com.portfolio.finance.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Regras e Cálculos Determinísticos do Orçamento")
class BudgetServiceTest {

    private static final Long USER_ID = 1L;
    private static final Long OTHER_USER_ID = 999L;

    @Mock
    private CategoryRepository categoryRepository;
    @Mock
    private TransactionRepository transactionRepository;
    @Mock
    private ContactRepository contactRepository;

    private BudgetService budgetService;

    @BeforeEach
    void setUp() {
        budgetService = new BudgetService(categoryRepository, transactionRepository, contactRepository);
    }

    @Test
    @DisplayName("Cálculo determinístico do gasto consolidado e aderência ao teto")
    void getBudgetCalculatesDeterministicSpendAndAdherence() {
        User user = new User("Admin", "admin@email.com", "hash");
        Category cat1 = new Category("Infraestrutura Cloud", "chart-1", new BigDecimal("4000.00"), "VARIABLE", user);
        Category cat2 = new Category("Locação Comercial", "chart-2", new BigDecimal("5000.00"), "FIXED", user);
        org.springframework.test.util.ReflectionTestUtils.setField(cat1, "id", 1L);
        org.springframework.test.util.ReflectionTestUtils.setField(cat2, "id", 2L);

        LocalDate date = LocalDate.of(2026, 10, 10);
        Transaction tx1 = new Transaction("AWS Cloud", new BigDecimal("2000.00"), date, TransactionType.EXPENSE, cat1, user);
        Transaction tx2 = new Transaction("Aluguel", new BigDecimal("5000.00"), date, TransactionType.EXPENSE, cat2, user);

        when(categoryRepository.findAllByUserIdOrderByNameAsc(USER_ID)).thenReturn(List.of(cat1, cat2));
        when(transactionRepository.findAllByUserIdOrderByDateDesc(USER_ID)).thenReturn(List.of(tx1, tx2));

        BudgetResponse response = budgetService.getBudget(USER_ID, LocalDate.of(2026, 10, 1), LocalDate.of(2026, 10, 31));

        assertThat(response.consolidatedSpend()).isEqualByComparingTo(new BigDecimal("7000.00"));
        assertThat(response.transactionCount()).isEqualTo(2);
        // cat1: (2000 / 4000) * 100 = 50%
        // cat2: (5000 / 5000) * 100 = 100%
        // média = (50 + 100) / 2 = 75%
        assertThat(response.avgCeilingAdherence()).isEqualTo(75);
        assertThat(response.formula()).contains("Gasto Consolidado = ∑(despesas");
    }

    @Test
    @DisplayName("Atualizar centro de custo de outro usuário resulta em ResourceNotFoundException (404)")
    void updateCostCenterOfAnotherUserThrowsNotFound() {
        when(categoryRepository.findByIdAndUserId(10L, OTHER_USER_ID)).thenReturn(Optional.empty());

        CostCenterUpdateRequest request = new CostCenterUpdateRequest("Novo Nome", "FIXED", "chart-1",
                new BigDecimal("6000.00"), null);

        assertThatThrownBy(() -> budgetService.updateCostCenter(10L, request, OTHER_USER_ID))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("Atualizar centro de custo atualiza teto e contato responsável unificado")
    void updateCostCenterUpdatesCeilingAndContact() {
        User user = new User("Admin", "admin@email.com", "hash");
        Category category = new Category("Marketing", "chart-3", new BigDecimal("3500.00"), "INVESTMENT", user);

        when(categoryRepository.findByIdAndUserId(3L, USER_ID)).thenReturn(Optional.of(category));
        when(contactRepository.save(any(Contact.class))).thenAnswer(inv -> inv.getArgument(0));
        when(transactionRepository.findAllByUserIdOrderByDateDesc(USER_ID)).thenReturn(List.of());

        ContactRequest contactReq = new ContactRequest("Growth Leader", "growth@empresa.com", "+55 (11) 9999-8888");
        CostCenterUpdateRequest updateReq = new CostCenterUpdateRequest("Marketing & Aquisição", "INVESTMENT",
                "chart-3", new BigDecimal("4500.00"), contactReq);

        CostCenterDto result = budgetService.updateCostCenter(3L, updateReq, USER_ID);

        assertThat(result.name()).isEqualTo("Marketing & Aquisição");
        assertThat(result.ceiling()).isEqualByComparingTo(new BigDecimal("4500.00"));
        assertThat(result.contact()).isNotNull();
        assertThat(result.contact().name()).isEqualTo("Growth Leader");
    }
}
