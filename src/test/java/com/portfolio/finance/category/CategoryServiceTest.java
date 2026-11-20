package com.portfolio.finance.category;

import com.portfolio.finance.category.dto.CategoryRequest;
import com.portfolio.finance.exception.ConflictException;
import com.portfolio.finance.exception.ResourceNotFoundException;
import com.portfolio.finance.transaction.TransactionRepository;
import com.portfolio.finance.user.User;
import com.portfolio.finance.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Regra 3 (categorias): categoria de outro usuário é tratada como inexistente")
class CategoryServiceTest {

    private static final Long OTHER_USER_ID = 2L;

    @Mock
    private CategoryRepository categoryRepository;
    @Mock
    private TransactionRepository transactionRepository;
    @Mock
    private UserRepository userRepository;

    private CategoryService service;

    @BeforeEach
    void setUp() {
        service = new CategoryService(categoryRepository, transactionRepository, userRepository);
    }

    @Test
    void getOfAnotherUsersCategoryReturnsNotFound() {
        when(categoryRepository.findByIdAndUserId(10L, OTHER_USER_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.get(10L, OTHER_USER_ID)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void updateOfAnotherUsersCategoryReturnsNotFound() {
        when(categoryRepository.findByIdAndUserId(10L, OTHER_USER_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.update(10L, new CategoryRequest("Novo"), OTHER_USER_ID))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void deleteOfAnotherUsersCategoryReturnsNotFoundAndDeletesNothing() {
        when(categoryRepository.findByIdAndUserId(10L, OTHER_USER_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.delete(10L, OTHER_USER_ID)).isInstanceOf(ResourceNotFoundException.class);

        verify(categoryRepository, never()).delete(any());
    }

    @Test
    void deleteOfCategoryInUseReturnsConflict() {
        Category category = new Category("Mercado", new User("Maria", "maria@email.com", "hash"));
        when(categoryRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(category));
        when(transactionRepository.existsByCategoryId(category.getId())).thenReturn(true);

        assertThatThrownBy(() -> service.delete(10L, 1L)).isInstanceOf(ConflictException.class);

        verify(categoryRepository, never()).delete(any());
    }
}
