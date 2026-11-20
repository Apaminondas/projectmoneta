package com.portfolio.finance.transaction.dto;

import com.portfolio.finance.transaction.TransactionType;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("Regra 1 (Bean Validation): valor do lançamento deve ser positivo")
class TransactionRequestValidationTest {

    private static ValidatorFactory factory;
    private static Validator validator;

    @BeforeAll
    static void setUp() {
        factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @AfterAll
    static void tearDown() {
        factory.close();
    }

    private static TransactionRequest withAmount(BigDecimal amount) {
        return new TransactionRequest("Teste", amount, LocalDate.of(2026, 1, 1), TransactionType.EXPENSE, 1L);
    }

    @ParameterizedTest(name = "valor {0} gera violação em 'amount'")
    @ValueSource(strings = {"0", "-1", "-0.01"})
    void nonPositiveAmountIsInvalid(String amount) {
        Set<ConstraintViolation<TransactionRequest>> violations = validator.validate(withAmount(new BigDecimal(amount)));

        assertThat(violations)
                .anySatisfy(v -> {
                    assertThat(v.getPropertyPath()).hasToString("amount");
                    assertThat(v.getMessage()).isEqualTo("valor deve ser maior que zero");
                });
    }

    @Test
    void nullAmountIsInvalid() {
        assertThat(validator.validate(withAmount(null)))
                .anySatisfy(v -> assertThat(v.getPropertyPath()).hasToString("amount"));
    }

    @Test
    void positiveAmountIsValid() {
        assertThat(validator.validate(withAmount(new BigDecimal("0.01")))).isEmpty();
    }
}
