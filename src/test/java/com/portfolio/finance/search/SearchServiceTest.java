package com.portfolio.finance.search;

import com.portfolio.finance.account.Account;
import com.portfolio.finance.account.AccountRepository;
import com.portfolio.finance.category.Category;
import com.portfolio.finance.category.CategoryRepository;
import com.portfolio.finance.search.dto.SearchResponseDto;
import com.portfolio.finance.transaction.Transaction;
import com.portfolio.finance.transaction.TransactionRepository;
import com.portfolio.finance.transaction.TransactionType;
import com.portfolio.finance.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Regras da Busca Global Unificada")
class SearchServiceTest {

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private SearchService searchService;

    private User user;
    private Category category;
    private Account account;
    private Transaction transaction;

    @BeforeEach
    void setUp() {
        user = new User("Empresa Corp", "corp@empresa.com", "hash");
        category = new Category("Infraestrutura Cloud", user);
        category.update("Infraestrutura Cloud", "oklch(0.7 0.18 145)", new BigDecimal("5000.00"), "TI");
        account = new Account(user, "AWS Cloud", "TI", "Enterprise", "São Paulo", "SP", new BigDecimal("12000.00"), null);
        transaction = new Transaction("Fatura AWS Mensal", new BigDecimal("2850.00"), LocalDate.now(), TransactionType.EXPENSE, category, user);
    }

    @Test
    @DisplayName("Retorna vazio quando a busca tem menos de 2 caracteres")
    void returnsEmptyWhenQueryTooShort() {
        SearchResponseDto result = searchService.search(1L, "a");

        assertThat(result.results()).isEmpty();
        assertThat(result.totalCount()).isZero();
    }

    @Test
    @DisplayName("Agrega lançamentos, contas e centros de custo na busca")
    void aggregatesAllEntitiesInSearch() {
        when(transactionRepository.searchByKeyword(1L, "AWS"))
                .thenReturn(List.of(transaction));
        when(accountRepository.searchByKeyword(1L, "AWS"))
                .thenReturn(List.of(account));
        when(categoryRepository.searchByKeyword(1L, "AWS"))
                .thenReturn(List.of(category));

        SearchResponseDto result = searchService.search(1L, "AWS");

        assertThat(result.totalCount()).isEqualTo(3);
        assertThat(result.results()).extracting("section")
                .containsExactlyInAnyOrder("deals", "customers", "pipeline");
    }
}
