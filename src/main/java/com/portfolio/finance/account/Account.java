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
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "accounts")
public class Account {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, updatable = false)
    private User user;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(length = 100)
    private String segment;

    @Column(nullable = false, length = 50)
    private String tier = "Principal";

    @Column(length = 100)
    private String city;

    @Column(length = 2)
    private String uf;

    @Column(name = "opening_balance", nullable = false, precision = 19, scale = 2)
    private BigDecimal openingBalance = BigDecimal.ZERO;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "primary_contact_id")
    private Contact primaryContact;

    @Column(name = "archived_at")
    private LocalDateTime archivedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    protected Account() {
    }

    public Account(User user, String name, String segment, String tier, String city, String uf,
                   BigDecimal openingBalance, Contact primaryContact) {
        this.user = user;
        this.name = name;
        this.segment = segment;
        this.tier = tier != null && !tier.isBlank() ? tier : "Principal";
        this.city = city;
        this.uf = uf;
        this.openingBalance = openingBalance != null ? openingBalance : BigDecimal.ZERO;
        this.primaryContact = primaryContact;
    }

    @PrePersist
    void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.tier == null || this.tier.isBlank()) {
            this.tier = "Principal";
        }
        if (this.openingBalance == null) {
            this.openingBalance = BigDecimal.ZERO;
        }
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public void update(String name, String segment, String tier, String city, String uf,
                       BigDecimal openingBalance, Contact primaryContact) {
        this.name = name;
        this.segment = segment;
        if (tier != null && !tier.isBlank()) {
            this.tier = tier;
        }
        this.city = city;
        this.uf = uf;
        if (openingBalance != null) {
            this.openingBalance = openingBalance;
        }
        this.primaryContact = primaryContact;
    }

    public void archive() {
        this.archivedAt = LocalDateTime.now();
    }

    public void unarchive() {
        this.archivedAt = null;
    }

    public boolean isArchived() {
        return this.archivedAt != null;
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public String getName() {
        return name;
    }

    public String getSegment() {
        return segment;
    }

    public String getTier() {
        return tier;
    }

    public String getCity() {
        return city;
    }

    public String getUf() {
        return uf;
    }

    public BigDecimal getOpeningBalance() {
        return openingBalance;
    }

    public Contact getPrimaryContact() {
        return primaryContact;
    }

    public void setPrimaryContact(Contact primaryContact) {
        this.primaryContact = primaryContact;
    }

    public LocalDateTime getArchivedAt() {
        return archivedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
