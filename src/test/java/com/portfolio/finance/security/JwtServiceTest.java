package com.portfolio.finance.security;

import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {

    private static final String SECRET = "test-secret-with-at-least-32-characters-123456";
    private static final Instant NOW = Instant.parse("2026-10-09T12:00:00Z");

    private JwtService serviceAt(Instant instant) {
        return new JwtService(new JwtProperties(SECRET, 60_000), Clock.fixed(instant, ZoneOffset.UTC));
    }

    @Test
    void generatedTokenCarriesUserId() {
        JwtService service = serviceAt(NOW);

        String token = service.generateToken(42L, "maria@email.com");

        assertThat(service.extractUserId(token)).contains(42L);
    }

    @Test
    void tamperedTokenIsRejected() {
        JwtService service = serviceAt(NOW);
        String token = service.generateToken(42L, "maria@email.com");

        String tampered = token.substring(0, token.length() - 2) + (token.endsWith("A") ? "BB" : "AA");

        assertThat(service.extractUserId(tampered)).isEmpty();
    }

    @Test
    void tokenSignedWithAnotherSecretIsRejected() {
        JwtService other = new JwtService(
                new JwtProperties("another-secret-with-at-least-32-characters-xyz", 60_000),
                Clock.fixed(NOW, ZoneOffset.UTC));

        assertThat(serviceAt(NOW).extractUserId(other.generateToken(42L, "x@email.com"))).isEmpty();
    }

    @Test
    void expiredTokenIsRejected() {
        String token = serviceAt(NOW).generateToken(42L, "maria@email.com");

        assertThat(serviceAt(NOW.plusSeconds(120)).extractUserId(token)).isEmpty();
    }

    @Test
    void garbageIsRejected() {
        assertThat(serviceAt(NOW).extractUserId("not-a-jwt")).isEmpty();
    }
}
