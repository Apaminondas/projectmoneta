package com.portfolio.finance.forecast;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RiskFactorRepository extends JpaRepository<RiskFactor, Long> {

    List<RiskFactor> findAllByUserIdAndStatusOrderByCreatedAtDesc(Long userId, String status);

    Optional<RiskFactor> findByIdAndUserId(Long id, Long userId);
}
