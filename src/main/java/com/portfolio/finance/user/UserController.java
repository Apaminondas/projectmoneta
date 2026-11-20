package com.portfolio.finance.user;

import com.portfolio.finance.exception.ResourceNotFoundException;
import com.portfolio.finance.security.AuthenticatedUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@Tag(name = "Usuários", description = "Dados do usuário autenticado")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/me")
    @Operation(summary = "Retorna perfil do usuário autenticado")
    public UserProfileResponse me(@AuthenticationPrincipal AuthenticatedUser auth) {
        Long userId = java.util.Objects.requireNonNull(auth.id(), "auth.id não pode ser nulo");
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário", userId));
        return new UserProfileResponse(user.getId(), user.getName(), user.getEmail());
    }

    public record UserProfileResponse(Long id, String name, String email) {}
}
