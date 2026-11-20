package com.portfolio.finance.account;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ContactRepository extends JpaRepository<Contact, Long> {

    Optional<Contact> findByIdAndUserId(Long id, Long userId);

    List<Contact> findAllByUserId(Long userId);
}
