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
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "generated_reports")
public class GeneratedReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, updatable = false)
    private User user;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(name = "report_type", nullable = false, length = 50)
    private String reportType;

    @Column(nullable = false, length = 50)
    private String period;

    @Column(name = "file_format", nullable = false, length = 10)
    private String fileFormat = "PDF";

    @Column(nullable = false, length = 20)
    private String status = "COMPLETED";

    @Column(name = "file_size_bytes")
    private Long fileSizeBytes;

    @Basic(fetch = FetchType.LAZY)
    @Column(name = "pdf_data", columnDefinition = "bytea")
    private byte[] pdfData;

    @Column(name = "download_count", nullable = false)
    private int downloadCount = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    protected GeneratedReport() {
    }

    public GeneratedReport(User user, String title, String reportType, String period,
                           String fileFormat, String status, Long fileSizeBytes, byte[] pdfData) {
        this.user = user;
        this.title = title;
        this.reportType = reportType;
        this.period = period;
        this.fileFormat = fileFormat != null ? fileFormat : "PDF";
        this.status = status != null ? status : "COMPLETED";
        this.fileSizeBytes = fileSizeBytes;
        this.pdfData = pdfData;
    }

    @PrePersist
    public void onPrePersist() {
        this.createdAt = LocalDateTime.now();
    }

    public void incrementDownloadCount() {
        this.downloadCount++;
    }

    public void complete(byte[] pdfData, Long size) {
        this.pdfData = pdfData;
        this.fileSizeBytes = size;
        this.status = "COMPLETED";
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

    public String getReportType() {
        return reportType;
    }

    public String getPeriod() {
        return period;
    }

    public String getFileFormat() {
        return fileFormat;
    }

    public String getStatus() {
        return status;
    }

    public Long getFileSizeBytes() {
        return fileSizeBytes;
    }

    public byte[] getPdfData() {
        return pdfData;
    }

    public int getDownloadCount() {
        return downloadCount;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
