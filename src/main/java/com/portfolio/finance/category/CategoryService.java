package com.portfolio.finance.category;

import com.portfolio.finance.category.dto.CategoryRequest;
import com.portfolio.finance.category.dto.CategoryResponse;
import com.portfolio.finance.exception.ConflictException;
import com.portfolio.finance.exception.ResourceNotFoundException;
import com.portfolio.finance.transaction.TransactionRepository;
import com.portfolio.finance.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    public CategoryService(CategoryRepository categoryRepository,
                           TransactionRepository transactionRepository,
                           UserRepository userRepository) {
        this.categoryRepository = categoryRepository;
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> list(Long userId) {
        return categoryRepository.findAllByUserIdOrderByNameAsc(userId).stream()
                .map(CategoryResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public CategoryResponse get(Long id, Long userId) {
        return CategoryResponse.from(findOwned(id, userId));
    }

    @Transactional
    public CategoryResponse create(CategoryRequest request, Long userId) {
        Category category = new Category(
                request.name().trim(),
                request.colorToken(),
                request.monthlyCeiling(),
                request.kind(),
                userRepository.getReferenceById(userId)
        );
        return CategoryResponse.from(categoryRepository.save(category));
    }

    @Transactional
    public CategoryResponse update(Long id, CategoryRequest request, Long userId) {
        Category category = findOwned(id, userId);
        category.update(
                request.name().trim(),
                request.colorToken(),
                request.monthlyCeiling(),
                request.kind()
        );
        return CategoryResponse.from(category);
    }

    @Transactional
    public void delete(Long id, Long userId) {
        Category category = findOwned(id, userId);
        if (transactionRepository.existsByCategoryId(category.getId())) {
            throw new ConflictException("Categoria possui lançamentos vinculados e não pode ser removida");
        }
        categoryRepository.delete(category);
    }

    /**
     * Regra 3 (isolamento): retorna a categoria somente se pertencer ao usuário;
     * caso contrário lança 404, sem revelar que ela existe para outro usuário.
     */
    @Transactional(readOnly = true)
    public Category findOwned(Long id, Long userId) {
        return categoryRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Categoria", id));
    }
}
