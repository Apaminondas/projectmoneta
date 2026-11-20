package com.portfolio.finance.notification;

import com.portfolio.finance.exception.ResourceNotFoundException;
import com.portfolio.finance.notification.dto.NotificationDto;
import com.portfolio.finance.user.User;
import com.portfolio.finance.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Regras e Gestão de Notificações")
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private NotificationService notificationService;

    private User user;
    private Notification notification;

    @BeforeEach
    void setUp() {
        user = new User("Finanças Admin", "admin@financas.com", "hash");
        notification = new Notification(user, "Teto 80%", "Infraestrutura atingiu 82%", "CEILING_ALERT", "team");
    }

    @Test
    @DisplayName("Lista notificações do usuário com tempo relativo calculado")
    void listsNotificationsSuccessfully() {
        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(1L))
                .thenReturn(List.of(notification));

        List<NotificationDto> result = notificationService.listNotifications(1L, false);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).title()).isEqualTo("Teto 80%");
        assertThat(result.get(0).type()).isEqualTo("CEILING_ALERT");
    }

    @Test
    @DisplayName("Conta notificações não lidas corretamente")
    void countsUnreadNotifications() {
        when(notificationRepository.countByUserIdAndReadFalse(1L)).thenReturn(3L);

        long count = notificationService.getUnreadCount(1L);

        assertThat(count).isEqualTo(3L);
    }

    @Test
    @DisplayName("Marca notificação como lida com isolamento por usuário")
    void marksNotificationAsRead() {
        when(notificationRepository.findByIdAndUserId(10L, 1L))
                .thenReturn(Optional.of(notification));

        NotificationDto dto = notificationService.markAsRead(1L, 10L);

        assertThat(dto.read()).isTrue();
    }

    @Test
    @DisplayName("Lança 404 ao tentar ler notificação de outro usuário")
    void throws404ForNotificationOfOtherUser() {
        when(notificationRepository.findByIdAndUserId(99L, 1L))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> notificationService.markAsRead(1L, 99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("Marca todas as notificações do usuário como lidas")
    void marksAllAsRead() {
        notificationService.markAllAsRead(1L);
        verify(notificationRepository).markAllAsReadForUser(1L);
    }
}
