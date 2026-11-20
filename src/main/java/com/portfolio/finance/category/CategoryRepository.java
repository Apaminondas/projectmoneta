package com.portfolio.finance.category;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * Todas as consultas são filtradas por usuário (regra 3: isolamento).
 */
public interface CategoryRepository extends JpaRepository<Category, Long> {

    List<Category> findAllByUserIdOrderByNameAsc(Long userId);

    Optional<Category> findByIdAndUserId(Long id, Long userId);

    @org.springframework.data.jpa.repository.Query("""
            select c from Category c
             where c.user.id = :userId
               and (lower(c.name) like lower(concat('%', :q, '%'))
                    or lower(coalesce(c.kind, '')) like lower(concat('%', :q, '%')))
             order by c.name asc
            """)
    List<Category> searchByKeyword(@org.springframework.data.repository.query.Param("userId") Long userId,
                                   @org.springframework.data.repository.query.Param("q") String q);
}


