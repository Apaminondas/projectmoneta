package com.portfolio.finance.notification;

import com.portfolio.finance.user.User;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notification_preferences")
public class NotificationPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "deal_updates_email", nullable = false)
    private boolean dealUpdatesEmail = true;

    @Column(name = "deal_updates_push", nullable = false)
    private boolean dealUpdatesPush = true;

    @Column(name = "team_activity_email", nullable = false)
    private boolean teamActivityEmail = true;

    @Column(name = "team_activity_push", nullable = false)
    private boolean teamActivityPush = false;

    @Column(name = "pipeline_alerts_email", nullable = false)
    private boolean pipelineAlertsEmail = true;

    @Column(name = "pipeline_alerts_push", nullable = false)
    private boolean pipelineAlertsPush = true;

    @Column(name = "forecast_updates_email", nullable = false)
    private boolean forecastUpdatesEmail = true;

    @Column(name = "forecast_updates_push", nullable = false)
    private boolean forecastUpdatesPush = false;

    @Column(name = "customer_health_email", nullable = false)
    private boolean customerHealthEmail = false;

    @Column(name = "customer_health_push", nullable = false)
    private boolean customerHealthPush = true;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    public NotificationPreference() {}

    public NotificationPreference(User user) {
        this.user = user;
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public boolean isDealUpdatesEmail() {
        return dealUpdatesEmail;
    }

    public void setDealUpdatesEmail(boolean dealUpdatesEmail) {
        this.dealUpdatesEmail = dealUpdatesEmail;
    }

    public boolean isDealUpdatesPush() {
        return dealUpdatesPush;
    }

    public void setDealUpdatesPush(boolean dealUpdatesPush) {
        this.dealUpdatesPush = dealUpdatesPush;
    }

    public boolean isTeamActivityEmail() {
        return teamActivityEmail;
    }

    public void setTeamActivityEmail(boolean teamActivityEmail) {
        this.teamActivityEmail = teamActivityEmail;
    }

    public boolean isTeamActivityPush() {
        return teamActivityPush;
    }

    public void setTeamActivityPush(boolean teamActivityPush) {
        this.teamActivityPush = teamActivityPush;
    }

    public boolean isPipelineAlertsEmail() {
        return pipelineAlertsEmail;
    }

    public void setPipelineAlertsEmail(boolean pipelineAlertsEmail) {
        this.pipelineAlertsEmail = pipelineAlertsEmail;
    }

    public boolean isPipelineAlertsPush() {
        return pipelineAlertsPush;
    }

    public void setPipelineAlertsPush(boolean pipelineAlertsPush) {
        this.pipelineAlertsPush = pipelineAlertsPush;
    }

    public boolean isForecastUpdatesEmail() {
        return forecastUpdatesEmail;
    }

    public void setForecastUpdatesEmail(boolean forecastUpdatesEmail) {
        this.forecastUpdatesEmail = forecastUpdatesEmail;
    }

    public boolean isForecastUpdatesPush() {
        return forecastUpdatesPush;
    }

    public void setForecastUpdatesPush(boolean forecastUpdatesPush) {
        this.forecastUpdatesPush = forecastUpdatesPush;
    }

    public boolean isCustomerHealthEmail() {
        return customerHealthEmail;
    }

    public void setCustomerHealthEmail(boolean customerHealthEmail) {
        this.customerHealthEmail = customerHealthEmail;
    }

    public boolean isCustomerHealthPush() {
        return customerHealthPush;
    }

    public void setCustomerHealthPush(boolean customerHealthPush) {
        this.customerHealthPush = customerHealthPush;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
