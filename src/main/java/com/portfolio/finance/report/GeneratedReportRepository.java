package com.portfolio.finance.report;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GeneratedReportRepository extends JpaRepository<GeneratedReport, Long> {

    List<GeneratedReport> findAllByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<GeneratedReport> findByIdAndUserId(Long id, Long userId);
}
