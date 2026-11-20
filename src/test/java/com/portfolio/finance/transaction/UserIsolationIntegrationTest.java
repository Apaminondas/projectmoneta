package com.portfolio.finance.transaction;

import com.portfolio.finance.BaseIntegrationTest;
import com.portfolio.finance.auth.dto.RegisterRequest;
import com.portfolio.finance.auth.dto.TokenResponse;
import com.portfolio.finance.category.dto.CategoryRequest;
import com.portfolio.finance.category.dto.CategoryResponse;
import com.portfolio.finance.transaction.dto.TransactionRequest;
import com.portfolio.finance.transaction.dto.TransactionResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.hamcrest.Matchers.empty;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@DisplayName("Testes de Integração: Regra 3 (Isolamento por Usuário)")
class UserIsolationIntegrationTest extends BaseIntegrationTest {

    private String registerAndGetToken(String name, String email) throws Exception {
        RegisterRequest request = new RegisterRequest(name, email, "senhaSegura123");
        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        TokenResponse tokenResponse = objectMapper.readValue(
                result.getResponse().getContentAsString(), TokenResponse.class);
        return tokenResponse.accessToken();
    }

    @Test
    @DisplayName("Garante isolamento absoluto de categorias e lançamentos entre usuários diferentes")
    void testFullIsolationBetweenUsers() throws Exception {
        String tokenUserA = registerAndGetToken("Usuario A", "usera@example.test");
        String tokenUserB = registerAndGetToken("Usuario B", "userb@example.test");

        // 1. Usuário A cria Categoria
        CategoryRequest catReqA = new CategoryRequest("Transporte User A");
        MvcResult catResult = mockMvc.perform(post("/api/categories")
                        .header("Authorization", "Bearer " + tokenUserA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(catReqA)))
                .andExpect(status().isCreated())
                .andReturn();
        CategoryResponse catA = objectMapper.readValue(
                catResult.getResponse().getContentAsString(), CategoryResponse.class);

        // 2. Usuário A cria Lançamento
        TransactionRequest txReqA = new TransactionRequest(
                "Gasolina",
                new BigDecimal("120.50"),
                LocalDate.now().minusDays(1),
                TransactionType.EXPENSE,
                catA.id()
        );
        MvcResult txResult = mockMvc.perform(post("/api/transactions")
                        .header("Authorization", "Bearer " + tokenUserA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(txReqA)))
                .andExpect(status().isCreated())
                .andReturn();
        TransactionResponse txA = objectMapper.readValue(
                txResult.getResponse().getContentAsString(), TransactionResponse.class);

        // 3. Usuário B lista categorias: vê apenas suas categorias padrão, nunca a categoria de A
        mockMvc.perform(get("/api/categories")
                        .header("Authorization", "Bearer " + tokenUserB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].id", not(hasItem(catA.id().intValue()))))
                .andExpect(jsonPath("$[*].name", not(hasItem("Transporte User A"))));

        // 4. Usuário B tenta GET categoria de A -> 404
        mockMvc.perform(get("/api/categories/" + catA.id())
                        .header("Authorization", "Bearer " + tokenUserB))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status", is(404)));

        // 5. Usuário B tenta PUT categoria de A -> 404
        mockMvc.perform(put("/api/categories/" + catA.id())
                        .header("Authorization", "Bearer " + tokenUserB)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CategoryRequest("Hacked"))))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status", is(404)));

        // 6. Usuário B tenta DELETE categoria de A -> 404
        mockMvc.perform(delete("/api/categories/" + catA.id())
                        .header("Authorization", "Bearer " + tokenUserB))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status", is(404)));

        // 7. Usuário B lista lançamentos: não deve ver os lançamentos de A
        mockMvc.perform(get("/api/transactions")
                        .header("Authorization", "Bearer " + tokenUserB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", empty()));

        // 8. Usuário B tenta GET lançamento de A -> 404
        mockMvc.perform(get("/api/transactions/" + txA.id())
                        .header("Authorization", "Bearer " + tokenUserB))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status", is(404)));

        // 9. Usuário B tenta PUT lançamento de A -> 404
        mockMvc.perform(put("/api/transactions/" + txA.id())
                        .header("Authorization", "Bearer " + tokenUserB)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(txReqA)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status", is(404)));

        // 10. Usuário B tenta DELETE lançamento de A -> 404
        mockMvc.perform(delete("/api/transactions/" + txA.id())
                        .header("Authorization", "Bearer " + tokenUserB))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status", is(404)));

        // 11. Usuário B tenta criar lançamento usando categoria de A -> 404
        TransactionRequest txBWithCatA = new TransactionRequest(
                "Despesa B",
                new BigDecimal("50.00"),
                LocalDate.now().minusDays(1),
                TransactionType.EXPENSE,
                catA.id()
        );
        mockMvc.perform(post("/api/transactions")
                        .header("Authorization", "Bearer " + tokenUserB)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(txBWithCatA)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status", is(404)));

        // 12. Usuário B consulta resumo mensal: como não possui lançamentos, deve retornar 422 (Regra 4)
        mockMvc.perform(get("/api/summary/monthly")
                        .param("year", String.valueOf(LocalDate.now().getYear()))
                        .param("month", String.valueOf(LocalDate.now().getMonthValue()))
                        .header("Authorization", "Bearer " + tokenUserB))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.status", is(422)));

        // 13. Usuário A consulta resumo mensal: tem lançamentos, deve retornar 200
        mockMvc.perform(get("/api/summary/monthly")
                        .param("year", String.valueOf(LocalDate.now().getYear()))
                        .param("month", String.valueOf(LocalDate.now().getMonthValue()))
                        .header("Authorization", "Bearer " + tokenUserA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalExpense", is(120.50)));
    }

    @Test
    @DisplayName("C7: GET /api/summary/reference-period exige JWT, isola por usuário e usa mês mais recente com lançamento ou mês corrente")
    void referencePeriodRequiresJwtAndIsolatesByUser() throws Exception {
        // Sem token -> 401
        mockMvc.perform(get("/api/summary/reference-period"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status", is(401)));

        String tokenUserA = registerAndGetToken("Ref User A", "ref.a@example.test");
        String tokenUserB = registerAndGetToken("Ref User B", "ref.b@example.test");

        // Usuário B sem lançamentos -> cai no mês corrente do relógio
        LocalDate today = LocalDate.now();
        mockMvc.perform(get("/api/summary/reference-period")
                        .header("Authorization", "Bearer " + tokenUserB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.year", is(today.getYear())))
                .andExpect(jsonPath("$.month", is(today.getMonthValue())));

        // Usuário A cria categoria e lançamento em Ago/2026
        CategoryRequest catReqA = new CategoryRequest("Receita SaaS A");
        MvcResult catResA = mockMvc.perform(post("/api/categories")
                        .header("Authorization", "Bearer " + tokenUserA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(catReqA)))
                .andExpect(status().isCreated())
                .andReturn();
        CategoryResponse catA = objectMapper.readValue(
                catResA.getResponse().getContentAsString(), CategoryResponse.class);

        TransactionRequest txA = new TransactionRequest(
                "Contrato Ago",
                new BigDecimal("5000.00"),
                LocalDate.of(2026, 8, 15),
                TransactionType.INCOME,
                catA.id()
        );
        mockMvc.perform(post("/api/transactions")
                        .header("Authorization", "Bearer " + tokenUserA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(txA)))
                .andExpect(status().isCreated());

        // Usuário B cria categoria e lançamento mais recente em Out/2026
        CategoryRequest catReqB = new CategoryRequest("Receita SaaS B");
        MvcResult catResB = mockMvc.perform(post("/api/categories")
                        .header("Authorization", "Bearer " + tokenUserB)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(catReqB)))
                .andExpect(status().isCreated())
                .andReturn();
        CategoryResponse catB = objectMapper.readValue(
                catResB.getResponse().getContentAsString(), CategoryResponse.class);

        TransactionRequest txB = new TransactionRequest(
                "Contrato Out",
                new BigDecimal("8000.00"),
                LocalDate.of(2026, 10, 20),
                TransactionType.INCOME,
                catB.id()
        );
        mockMvc.perform(post("/api/transactions")
                        .header("Authorization", "Bearer " + tokenUserB)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(txB)))
                .andExpect(status().isCreated());

        // Usuário A continua vendo 2026/8 (não vaza o lançamento 2026/10 de B)
        mockMvc.perform(get("/api/summary/reference-period")
                        .header("Authorization", "Bearer " + tokenUserA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.year", is(2026)))
                .andExpect(jsonPath("$.month", is(8)));

        // Usuário B vê 2026/10
        mockMvc.perform(get("/api/summary/reference-period")
                        .header("Authorization", "Bearer " + tokenUserB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.year", is(2026)))
                .andExpect(jsonPath("$.month", is(10)));
    }
}
