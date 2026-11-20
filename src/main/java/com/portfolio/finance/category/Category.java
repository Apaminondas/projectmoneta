package com.portfolio.finance.category;

import com.portfolio.finance.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "categories")
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80)
    private String name;

    @Column(name = "color_token", nullable = false, length = 30)
    private String colorToken = "chart-1";

    @Column(name = "monthly_ceiling", precision = 19, scale = 2)
    private java.math.BigDecimal monthlyCeiling;

    @Column(nullable = false, length = 30)
    private String kind = "VARIABLE";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responsible_contact_id")
    private com.portfolio.finance.account.Contact responsibleContact;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, updatable = false)
    private User user;

    protected Category() {
        // exigido pelo JPA
    }

    public Category(String name, User user) {
        this(name, "chart-1", null, "VARIABLE", user);
    }

    public Category(String name, String colorToken, java.math.BigDecimal monthlyCeiling, String kind, User user) {
        this.name = name;
        this.colorToken = (colorToken != null && !colorToken.isBlank()) ? colorToken : "chart-1";
        this.monthlyCeiling = monthlyCeiling;
        this.kind = (kind != null && !kind.isBlank()) ? kind : "VARIABLE";
        this.user = user;
    }

    public void rename(String name) {
        this.name = name;
    }

    public void update(String name, String colorToken, java.math.BigDecimal monthlyCeiling, String kind) {
        this.name = name;
        if (colorToken != null && !colorToken.isBlank()) {
            this.colorToken = colorToken;
        }
        this.monthlyCeiling = monthlyCeiling;
        if (kind != null && !kind.isBlank()) {
            this.kind = kind;
        }
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getColorToken() {
        return colorToken;
    }

    public java.math.BigDecimal getMonthlyCeiling() {
        return monthlyCeiling;
    }

    public String getKind() {
        return kind;
    }

    public void update(String name, String colorToken, java.math.BigDecimal monthlyCeiling, String kind,
                       com.portfolio.finance.account.Contact responsibleContact) {
        update(name, colorToken, monthlyCeiling, kind);
        this.responsibleContact = responsibleContact;
    }

    public com.portfolio.finance.account.Contact getResponsibleContact() {
        return responsibleContact;
    }

    public void setResponsibleContact(com.portfolio.finance.account.Contact responsibleContact) {
        this.responsibleContact = responsibleContact;
    }

    public User getUser() {
        return user;
    }
}
