package com.portfolio.finance.account;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AccountRepository extends JpaRepository<Account, Long> {

    Optional<Account> findByIdAndUserId(Long id, Long userId);

    List<Account> findAllByUserIdAndArchivedAtIsNullOrderByIdAsc(Long userId);

    List<Account> findAllByUserIdOrderByIdAsc(Long userId);

    @org.springframework.data.jpa.repository.Query("""
            select a from Account a
             where a.user.id = :userId
               and (lower(a.name) like lower(concat('%', :q, '%'))
                    or lower(coalesce(a.segment, '')) like lower(concat('%', :q, '%')))
             order by a.name asc
            """)
    List<Account> searchByKeyword(@org.springframework.data.repository.query.Param("userId") Long userId,
                                  @org.springframework.data.repository.query.Param("q") String q);
}

