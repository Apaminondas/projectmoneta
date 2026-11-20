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
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "risk_factors")
public class RiskFactor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, updatable = false)
    private User user;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 100)
    private String category;

    @Column(nullable = false, length = 30)
    private String severity = "medium";

    @Column(name = "estimated_amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal estimatedAmount = BigDecimal.ZERO;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 50)
    private String status = "ACTIVE";

    @Column(nullable = false, length = 30)
    private String origin = "MANUAL";

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    protected RiskFactor() {
    }

    public RiskFactor(User user, String title, String category, String severity,
                      BigDecimal estimatedAmount, String description, String origin) {
        this.user = user;
        this.title = title;
        this.category = category;
        this.severity = severity != null && !severity.isBlank() ? severity : "medium";
        this.estimatedAmount = estimatedAmount != null ? estimatedAmount : BigDecimal.ZERO;
        this.description = description;
        this.status = "ACTIVE";
        this.origin = origin != null && !origin.isBlank() ? origin : "MANUAL";
    }

    @PrePersist
    void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.status == null) this.status = "ACTIVE";
        if (this.origin == null) this.origin = "MANUAL";
        if (this.severity == null) this.severity = "medium";
        if (this.estimatedAmount == null) this.estimatedAmount = BigDecimal.ZERO;
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public String getTitle() {
        return title;
    }

    public String getCategory() {
        return category;
    }

    public String getSeverity() {
        return severity;
    }

    public BigDecimal getEstimatedAmount() {
        return estimatedAmount;
    }

    public String getDescription() {
        return description;
    }

    public String getStatus() {
        return status;
    }

    public String getOrigin() {
        return origin;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
