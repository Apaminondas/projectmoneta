package com.portfolio.finance.forecast;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MitigationPlanRepository extends JpaRepository<MitigationPlan, Long> {

    Optional<MitigationPlan> findByUserIdAndRiskKey(Long userId, String riskKey);
}
