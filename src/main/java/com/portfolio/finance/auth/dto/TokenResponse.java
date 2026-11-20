package com.portfolio.finance.auth.dto;

public record TokenResponse(
        String accessToken,
        String tokenType,
        long expiresInSeconds,
        UserResponse user
) {

    public record UserResponse(Long id, String name, String email) {
    }
}
