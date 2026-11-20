package com.portfolio.finance.notification;

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
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, updatable = false)
    private User user;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(nullable = false, length = 500)
    private String message;

    @Column(nullable = false, length = 50)
    private String type;

    @Column(name = "read", nullable = false)
    private boolean read = false;

    @Column(length = 255)
    private String link;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    protected Notification() {
    }

    public Notification(User user, String title, String message, String type, String link) {
        this.user = user;
        this.title = title;
        this.message = message;
        this.type = type != null ? type : "SYSTEM";
        this.link = link;
    }

    @PrePersist
    public void onPrePersist() {
        this.createdAt = LocalDateTime.now();
    }

    public void markAsRead() {
        this.read = true;
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

    public String getMessage() {
        return message;
    }

    public String getType() {
        return type;
    }

    public boolean isRead() {
        return read;
    }

    public String getLink() {
        return link;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
