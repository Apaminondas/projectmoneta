package com.portfolio.finance.forecast;

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
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "mitigation_plans")
public class MitigationPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, updatable = false)
    private User user;

    @Column(name = "risk_key", nullable = false, length = 100)
    private String riskKey;

    @Column(columnDefinition = "TEXT")
    private String actions;

    @Column(length = 150)
    private String owner;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(nullable = false, length = 50)
    private String status = "IN_PROGRESS";

    @Column(name = "rule_reason", columnDefinition = "TEXT")
    private String ruleReason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    protected MitigationPlan() {
    }

    public MitigationPlan(User user, String riskKey, String actions, String owner,
                          LocalDate dueDate, String status, String ruleReason) {
        this.user = user;
        this.riskKey = riskKey;
        this.actions = actions;
        this.owner = owner;
        this.dueDate = dueDate;
        this.status = status != null && !status.isBlank() ? status : "IN_PROGRESS";
        this.ruleReason = ruleReason;
    }

    @PrePersist
    void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.status == null) this.status = "IN_PROGRESS";
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public void update(String actions, String owner, LocalDate dueDate, String status) {
        this.actions = actions;
        this.owner = owner;
        this.dueDate = dueDate;
        if (status != null && !status.isBlank()) {
            this.status = status;
        }
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public String getRiskKey() {
        return riskKey;
    }

    public String getActions() {
        return actions;
    }

    public String getOwner() {
        return owner;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public String getStatus() {
        return status;
    }

    public String getRuleReason() {
        return ruleReason;
    }

    public void setRuleReason(String ruleReason) {
        this.ruleReason = ruleReason;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
