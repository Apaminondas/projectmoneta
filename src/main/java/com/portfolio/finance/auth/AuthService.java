package com.portfolio.finance.auth;

import com.portfolio.finance.account.Account;
import com.portfolio.finance.account.AccountRepository;
import com.portfolio.finance.auth.dto.LoginRequest;
import com.portfolio.finance.auth.dto.RegisterRequest;
import com.portfolio.finance.auth.dto.TokenResponse;
import com.portfolio.finance.category.Category;
import com.portfolio.finance.category.CategoryRepository;
import com.portfolio.finance.exception.ConflictException;
import com.portfolio.finance.security.JwtService;
import com.portfolio.finance.user.User;
import com.portfolio.finance.user.UserRepository;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Locale;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final CategoryRepository categoryRepository;
    private final AccountRepository accountRepository;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService,
                       CategoryRepository categoryRepository, AccountRepository accountRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.categoryRepository = categoryRepository;
        this.accountRepository = accountRepository;
    }

    @Transactional
    public TokenResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ConflictException("E-mail já cadastrado");
        }
        User user = userRepository.save(
                new User(request.name().trim(), email, passwordEncoder.encode(request.password())));
        seedDefaultCategories(user);
        seedDefaultAccounts(user);
        return toTokenResponse(user);
    }

    private void seedDefaultCategories(User user) {
        categoryRepository.save(new Category("Folha de Pagamento", "chart-1", new BigDecimal("1000.00"), "VARIABLE", user));
        categoryRepository.save(new Category("Locação Comercial", "chart-1", new BigDecimal("5000.00"), "FIXED", user));
        categoryRepository.save(new Category("Infraestrutura Cloud", "chart-2", new BigDecimal("4000.00"), "VARIABLE", user));
        categoryRepository.save(new Category("Marketing & Aquisição", "chart-3", new BigDecimal("3500.00"), "INVESTMENT", user));
        categoryRepository.save(new Category("Consultorias & Jurídico", "chart-4", new BigDecimal("3500.00"), "SERVICE", user));
        categoryRepository.save(new Category("Softwares & SaaS", "chart-5", new BigDecimal("3000.00"), "SUBSCRIPTION", user));
    }

    private void seedDefaultAccounts(User user) {
        accountRepository.save(new Account(user, "Conta Corrente Principal", "Banco", "Principal", "São Paulo", "SP", new BigDecimal("25000.00"), null));
        accountRepository.save(new Account(user, "Conta Reserva", "Investimentos", "Reserva", "São Paulo", "SP", new BigDecimal("10000.00"), null));
        accountRepository.save(new Account(user, "Cartão Corporativo", "Cartão", "Secundária", "São Paulo", "SP", BigDecimal.ZERO, null));
    }

    @Transactional(readOnly = true)
    public TokenResponse login(LoginRequest request) {
        User user = userRepository.findByEmailIgnoreCase(normalizeEmail(request.email()))
                .filter(u -> passwordEncoder.matches(request.password(), u.getPasswordHash()))
                .orElseThrow(() -> new BadCredentialsException("Credenciais inválidas"));
        return toTokenResponse(user);
    }

    private TokenResponse toTokenResponse(User user) {
        String token = jwtService.generateToken(user.getId(), user.getEmail());
        return new TokenResponse(token, "Bearer", jwtService.getExpirationMs() / 1000,
                new TokenResponse.UserResponse(user.getId(), user.getName(), user.getEmail()));
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
