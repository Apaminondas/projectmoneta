package com.portfolio.finance.transaction;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Todas as consultas recebem o id do usuário (regra 3: isolamento).
 */
public interface TransactionRepository extends JpaRepository<Transaction, Long>,
        JpaSpecificationExecutor<Transaction> {

    @EntityGraph(attributePaths = "category")
    Optional<Transaction> findByIdAndUserId(Long id, Long userId);

    @Override
    @EntityGraph(attributePaths = "category")
    List<Transaction> findAll(Specification<Transaction> spec, Sort sort);

    @Override
    @EntityGraph(attributePaths = "category")
    Page<Transaction> findAll(Specification<Transaction> spec, Pageable pageable);

    boolean existsByUserId(Long userId);

    boolean existsByCategoryId(Long categoryId);

    @Query("select max(t.date) from Transaction t where t.user.id = :userId")
    Optional<LocalDate> findLatestDateByUserId(@Param("userId") Long userId);

    @Query("""
            select coalesce(sum(t.amount), 0)
              from Transaction t
             where t.user.id = :userId
               and t.type = :type
               and t.date between :start and :end
            """)
    BigDecimal sumByTypeAndPeriod(@Param("userId") Long userId,
                                  @Param("type") TransactionType type,
                                  @Param("start") LocalDate start,
                                  @Param("end") LocalDate end);

    @Query("""
            select new com.portfolio.finance.transaction.CategoryTypeTotal(c.id, c.name, t.type, sum(t.amount))
              from Transaction t
              join t.category c
             where t.user.id = :userId
               and (cast(:start as LocalDate) is null or t.date >= :start)
               and (cast(:end as LocalDate) is null or t.date <= :end)
             group by c.id, c.name, t.type
            """)
    List<CategoryTypeTotal> sumByCategoryAndType(@Param("userId") Long userId,
                                                 @Param("start") LocalDate start,
                                                 @Param("end") LocalDate end);

    @EntityGraph(attributePaths = {"category", "account"})
    List<Transaction> findByAccountIdAndUserIdOrderByDateDesc(Long accountId, Long userId);

    @EntityGraph(attributePaths = {"category", "account"})
    List<Transaction> findAllByUserIdOrderByDateDesc(Long userId);

    @EntityGraph(attributePaths = {"category", "account"})
    @Query("""
            select t from Transaction t
             where t.user.id = :userId
               and (lower(t.description) like lower(concat('%', :q, '%'))
                    or lower(coalesce(t.notes, '')) like lower(concat('%', :q, '%')))
             order by t.date desc
            """)
    List<Transaction> searchByKeyword(@Param("userId") Long userId, @Param("q") String q);
}

