package com.portfolio.finance.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;

/**
 * Emissão e validação de tokens JWT assinados com HMAC-SHA.
 * O "subject" do token é o id do usuário.
 */
@Service
public class JwtService {

    private final SecretKey key;
    private final long expirationMs;
    private final Clock clock;

    public JwtService(JwtProperties properties, Clock clock) {
        this.key = Keys.hmacShaKeyFor(properties.secret().getBytes(StandardCharsets.UTF_8));
        this.expirationMs = properties.expirationMs();
        this.clock = clock;
    }

    public String generateToken(Long userId, String email) {
        Instant now = clock.instant();
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("email", email)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(expirationMs)))
                .signWith(key)
                .compact();
    }

    /**
     * @return id do usuário se o token for válido (assinatura e expiração); vazio caso contrário.
     */
    public Optional<Long> extractUserId(String token) {
        return extractAuthenticatedUser(token).map(AuthenticatedUser::id);
    }

    /**
     * @return principal autenticado (id e e-mail do claim) se o token for válido; vazio caso contrário.
     */
    public Optional<AuthenticatedUser> extractAuthenticatedUser(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .clock(() -> Date.from(clock.instant()))
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            Long userId = Long.valueOf(claims.getSubject());
            String email = claims.get("email", String.class);
            return Optional.of(new AuthenticatedUser(userId, email));
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }

    public long getExpirationMs() {
        return expirationMs;
    }
}
