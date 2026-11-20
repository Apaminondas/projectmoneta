package com.portfolio.finance.account;

import com.portfolio.finance.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "appointments")
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, updatable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(name = "scheduled_at", nullable = false)
    private LocalDateTime scheduledAt;

    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    protected Appointment() {
    }

    public Appointment(User user, Account account, String title, LocalDateTime scheduledAt, String note) {
        this.user = user;
        this.account = account;
        this.title = title;
        this.scheduledAt = scheduledAt;
        this.note = note;
    }

    @PrePersist
    void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public void update(String title, LocalDateTime scheduledAt, String note) {
        if (title != null && !title.isBlank()) {
            this.title = title;
        }
        if (scheduledAt != null) {
            this.scheduledAt = scheduledAt;
        }
        this.note = note;
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public Account getAccount() {
        return account;
    }

    public String getTitle() {
        return title;
    }

    public LocalDateTime getScheduledAt() {
        return scheduledAt;
    }

    public String getNote() {
        return note;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
