-- V9: Notification Preferences Table
CREATE TABLE IF NOT EXISTS notification_preferences (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    deal_updates_email BOOLEAN NOT NULL DEFAULT TRUE,
    deal_updates_push BOOLEAN NOT NULL DEFAULT TRUE,
    team_activity_email BOOLEAN NOT NULL DEFAULT TRUE,
    team_activity_push BOOLEAN NOT NULL DEFAULT FALSE,
    pipeline_alerts_email BOOLEAN NOT NULL DEFAULT TRUE,
    pipeline_alerts_push BOOLEAN NOT NULL DEFAULT TRUE,
    forecast_updates_email BOOLEAN NOT NULL DEFAULT TRUE,
    forecast_updates_push BOOLEAN NOT NULL DEFAULT FALSE,
    customer_health_email BOOLEAN NOT NULL DEFAULT FALSE,
    customer_health_push BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO notification_preferences (user_id)
SELECT id FROM users
ON CONFLICT (user_id) DO NOTHING;
