package com.portfolio.finance.transaction;

import com.portfolio.finance.category.Category;
import com.portfolio.finance.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "transactions")
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String description;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false)
    private LocalDate date;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private TransactionType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TransactionStatus status = TransactionStatus.COMPLETED;

    @Column(name = "payment_method", length = 50)
    private String paymentMethod;

    @Column(length = 500)
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id")
    private com.portfolio.finance.account.Account account;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, updatable = false)
    private User user;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    protected Transaction() {
        // exigido pelo JPA
    }

    public Transaction(String description, BigDecimal amount, LocalDate date, TransactionType type,
                       Category category, User user) {
        this(description, amount, date, type, TransactionStatus.COMPLETED, null, null, category, user);
    }

    public Transaction(String description, BigDecimal amount, LocalDate date, TransactionType type,
                       TransactionStatus status, String paymentMethod, String notes,
                       Category category, User user) {
        this.description = description;
        this.amount = amount;
        this.date = date;
        this.type = type;
        this.status = status != null ? status : TransactionStatus.COMPLETED;
        this.paymentMethod = paymentMethod;
        this.notes = notes;
        this.category = category;
        this.user = user;
    }

    @PrePersist
    void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = TransactionStatus.COMPLETED;
        }
    }

    public void update(String description, BigDecimal amount, LocalDate date, TransactionType type,
                       Category category) {
        update(description, amount, date, type, this.status, this.paymentMethod, this.notes, category);
    }

    public void update(String description, BigDecimal amount, LocalDate date, TransactionType type,
                       TransactionStatus status, String paymentMethod, String notes,
                       Category category) {
        this.description = description;
        this.amount = amount;
        this.date = date;
        this.type = type;
        if (status != null) {
            this.status = status;
        }
        this.paymentMethod = paymentMethod;
        this.notes = notes;
        this.category = category;
    }

    public Long getId() {
        return id;
    }

    public String getDescription() {
        return description;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public LocalDate getDate() {
        return date;
    }

    public TransactionType getType() {
        return type;
    }

    public Category getCategory() {
        return category;
    }

    public User getUser() {
        return user;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public TransactionStatus getStatus() {
        return status;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public String getNotes() {
        return notes;
    }

    public com.portfolio.finance.account.Account getAccount() {
        return account;
    }

    public void setAccount(com.portfolio.finance.account.Account account) {
        this.account = account;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }
}
