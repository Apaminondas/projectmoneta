package com.portfolio.finance;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;

/**
 * A autenticação é feita por JWT + AuthService; o usuário em memória padrão do Spring Boot
 * é desabilitado para não gerar uma senha aleatória no log.
 */
@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
public class FinanceApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(FinanceApiApplication.class, args);
    }
}
