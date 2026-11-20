package com.portfolio.finance.notification;

import com.portfolio.finance.exception.ResourceNotFoundException;
import com.portfolio.finance.notification.dto.NotificationDto;
import com.portfolio.finance.notification.dto.NotificationPreferenceItemDto;
import com.portfolio.finance.user.User;
import com.portfolio.finance.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationPreferenceRepository preferenceRepository;
    private final UserRepository userRepository;

    public NotificationService(NotificationRepository notificationRepository,
                               NotificationPreferenceRepository preferenceRepository,
                               UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.preferenceRepository = preferenceRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<NotificationDto> listNotifications(Long userId, Boolean unreadOnly) {
        List<Notification> list = Boolean.TRUE.equals(unreadOnly)
                ? notificationRepository.findByUserIdAndReadFalseOrderByCreatedAtDesc(userId)
                : notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);

        LocalDateTime now = LocalDateTime.now();
        return list.stream()
                .map(n -> toDto(n, now))
                .toList();
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    public NotificationDto markAsRead(Long userId, Long notificationId) {
        Notification notification = notificationRepository.findByIdAndUserId(notificationId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Notificação", notificationId));

        notification.markAsRead();
        return toDto(notification, LocalDateTime.now());
    }

    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsReadForUser(userId);
    }

    public NotificationDto createNotification(Long userId, String title, String message, String type, String link) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário", userId));

        Notification notification = new Notification(user, title, message, type, link);
        Notification saved = notificationRepository.save(notification);
        return toDto(saved, LocalDateTime.now());
    }

    private NotificationDto toDto(Notification n, LocalDateTime now) {
        String relative = formatRelativeTime(n.getCreatedAt(), now);
        return new NotificationDto(
                n.getId(),
                n.getTitle(),
                n.getMessage(),
                n.getType(),
                n.isRead(),
                n.getLink(),
                n.getCreatedAt(),
                relative
        );
    }

    private String formatRelativeTime(LocalDateTime created, LocalDateTime now) {
        if (created == null) return "recente";
        Duration diff = Duration.between(created, now);
        long minutes = diff.toMinutes();
        if (minutes < 1) return "agora";
        if (minutes < 60) return "há " + minutes + " min";
        long hours = diff.toHours();
        if (hours < 24) return "há " + hours + " hora" + (hours > 1 ? "s" : "");
        long days = diff.toDays();
        if (days == 1) return "ontem";
        if (days < 30) return "há " + days + " dias";
        return "em " + created.toLocalDate().toString();
    }

    @Transactional(readOnly = true)
    public List<NotificationPreferenceItemDto> getPreferences(Long userId) {
        NotificationPreference pref = preferenceRepository.findByUserId(userId)
                .orElseGet(() -> createDefaultPreferences(userId));
        return toPreferenceDtos(pref);
    }

    public List<NotificationPreferenceItemDto> updatePreferences(Long userId, List<NotificationPreferenceItemDto> items) {
        NotificationPreference pref = preferenceRepository.findByUserId(userId)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new ResourceNotFoundException("Usuário", userId));
                    return new NotificationPreference(user);
                });

        if (items != null) {
            for (NotificationPreferenceItemDto item : items) {
                if (item.id() == null) continue;
                switch (item.id()) {
                    case "deal_updates" -> {
                        pref.setDealUpdatesEmail(item.email());
                        pref.setDealUpdatesPush(item.push());
                    }
                    case "team_activity" -> {
                        pref.setTeamActivityEmail(item.email());
                        pref.setTeamActivityPush(item.push());
                    }
                    case "pipeline_alerts" -> {
                        pref.setPipelineAlertsEmail(item.email());
                        pref.setPipelineAlertsPush(item.push());
                    }
                    case "forecast_updates" -> {
                        pref.setForecastUpdatesEmail(item.email());
                        pref.setForecastUpdatesPush(item.push());
                    }
                    case "customer_health" -> {
                        pref.setCustomerHealthEmail(item.email());
                        pref.setCustomerHealthPush(item.push());
                    }
                }
            }
        }
        pref.setUpdatedAt(LocalDateTime.now());
        NotificationPreference saved = preferenceRepository.save(pref);
        return toPreferenceDtos(saved);
    }

    @Transactional(readOnly = true)
    public boolean isNotificationEnabled(Long userId, String preferenceId) {
        NotificationPreference pref = preferenceRepository.findByUserId(userId)
                .orElse(null);
        if (pref == null) return true;
        return switch (preferenceId) {
            case "deal_updates" -> pref.isDealUpdatesEmail() || pref.isDealUpdatesPush();
            case "team_activity" -> pref.isTeamActivityEmail() || pref.isTeamActivityPush();
            case "pipeline_alerts" -> pref.isPipelineAlertsEmail() || pref.isPipelineAlertsPush();
            case "forecast_updates" -> pref.isForecastUpdatesEmail() || pref.isForecastUpdatesPush();
            case "customer_health" -> pref.isCustomerHealthEmail() || pref.isCustomerHealthPush();
            default -> true;
        };
    }

    private NotificationPreference createDefaultPreferences(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário", userId));
        return preferenceRepository.save(new NotificationPreference(user));
    }

    private List<NotificationPreferenceItemDto> toPreferenceDtos(NotificationPreference p) {
        return List.of(
                new NotificationPreferenceItemDto("deal_updates", "Novos Lançamentos", "Notificar ao registrar receitas ou despesas", p.isDealUpdatesEmail(), p.isDealUpdatesPush()),
                new NotificationPreferenceItemDto("team_activity", "Teto de Categoria", "Alertas ao atingir 80% do limite orçamentário", p.isTeamActivityEmail(), p.isTeamActivityPush()),
                new NotificationPreferenceItemDto("pipeline_alerts", "Vencimento de Contas", "Lembretes de contas fixas com vencimento próximo", p.isPipelineAlertsEmail(), p.isPipelineAlertsPush()),
                new NotificationPreferenceItemDto("forecast_updates", "Fechamento Mensal", "Resumo executivo consolidado todo dia 1º", p.isForecastUpdatesEmail(), p.isForecastUpdatesPush()),
                new NotificationPreferenceItemDto("customer_health", "Saldo Mínimo de Segurança", "Alerta se o saldo líquido ficar abaixo da reserva", p.isCustomerHealthEmail(), p.isCustomerHealthPush())
        );
    }
}

