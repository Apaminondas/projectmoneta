package com.portfolio.finance.report;

import com.portfolio.finance.user.User;
import jakarta.persistence.Basic;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "company_profiles")
public class CompanyProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "company_name", length = 150)
    private String companyName;

    @Column(name = "company_email", length = 150)
    private String companyEmail;

    @Column(name = "company_phone", length = 50)
    private String companyPhone;

    @Column(name = "footer_text", length = 255)
    private String footerText;

    @Basic(fetch = FetchType.LAZY)
    @Column(name = "logo_data", columnDefinition = "bytea")
    private byte[] logoData;

    @Column(name = "logo_content_type", length = 50)
    private String logoContentType;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    protected CompanyProfile() {
    }

    public CompanyProfile(User user, String companyName, String companyEmail, String companyPhone, String footerText) {
        this.user = user;
        this.companyName = companyName;
        this.companyEmail = companyEmail;
        this.companyPhone = companyPhone;
        this.footerText = footerText;
    }

    @PrePersist
    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public void update(String companyName, String companyEmail, String companyPhone, String footerText) {
        this.companyName = companyName;
        this.companyEmail = companyEmail;
        this.companyPhone = companyPhone;
        this.footerText = footerText;
    }

    public void setLogo(byte[] logoData, String logoContentType) {
        this.logoData = logoData;
        this.logoContentType = logoContentType;
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public String getCompanyName() {
        return companyName;
    }

    public String getCompanyEmail() {
        return companyEmail;
    }

    public String getCompanyPhone() {
        return companyPhone;
    }

    public String getFooterText() {
        return footerText;
    }

    public byte[] getLogoData() {
        return logoData;
    }

    public String getLogoContentType() {
        return logoContentType;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
