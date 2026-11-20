package com.portfolio.finance.account;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    Optional<Appointment> findByIdAndUserId(Long id, Long userId);

    List<Appointment> findByAccountIdAndUserIdOrderByScheduledAtAsc(Long accountId, Long userId);
}
