package com.portfolio.finance.notification;

import com.portfolio.finance.exception.ApiError;
import com.portfolio.finance.notification.dto.NotificationDto;
import com.portfolio.finance.notification.dto.NotificationPreferenceItemDto;
import com.portfolio.finance.security.AuthenticatedUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@Tag(name = "Notificações", description = "Gestão de notificações, alertas de teto e leitura")
@ApiResponse(responseCode = "401", description = "Token ausente ou inválido",
        content = @Content(schema = @Schema(implementation = ApiError.class)))
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    @Operation(summary = "Lista as notificações do usuário autenticado")
    public List<NotificationDto> list(
            @RequestParam(name = "unreadOnly", required = false) Boolean unreadOnly,
            @AuthenticationPrincipal AuthenticatedUser user) {
        return notificationService.listNotifications(user.id(), unreadOnly);
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Retorna a contagem de notificações não lidas")
    public Map<String, Long> getUnreadCount(@AuthenticationPrincipal AuthenticatedUser user) {
        long count = notificationService.getUnreadCount(user.id());
        return Map.of("unreadCount", count);
    }

    @PutMapping("/{id}/read")
    @Operation(summary = "Marca uma notificação como lida")
    @ApiResponse(responseCode = "200", description = "Notificação marcada como lida")
    @ApiResponse(responseCode = "404", description = "Notificação não encontrada ou de outro usuário",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public NotificationDto markAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal AuthenticatedUser user) {
        return notificationService.markAsRead(user.id(), id);
    }

    @PutMapping("/read-all")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Marca todas as notificações do usuário como lidas")
    public void markAllAsRead(@AuthenticationPrincipal AuthenticatedUser user) {
        notificationService.markAllAsRead(user.id());
    }

    @GetMapping("/preferences")
    @Operation(summary = "Obtém as preferências de notificações do usuário")
    public List<NotificationPreferenceItemDto> getPreferences(@AuthenticationPrincipal AuthenticatedUser user) {
        return notificationService.getPreferences(user.id());
    }

    @PutMapping("/preferences")
    @Operation(summary = "Atualiza as preferências de notificações do usuário")
    public List<NotificationPreferenceItemDto> updatePreferences(
            @RequestBody List<NotificationPreferenceItemDto> preferences,
            @AuthenticationPrincipal AuthenticatedUser user) {
        return notificationService.updatePreferences(user.id(), preferences);
    }
}
