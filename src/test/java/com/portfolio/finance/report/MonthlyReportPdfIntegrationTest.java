package com.portfolio.finance.report;

import com.portfolio.finance.BaseIntegrationTest;
import com.portfolio.finance.auth.dto.RegisterRequest;
import com.portfolio.finance.auth.dto.TokenResponse;
import com.portfolio.finance.category.dto.CategoryRequest;
import com.portfolio.finance.category.dto.CategoryResponse;
import com.portfolio.finance.transaction.TransactionType;
import com.portfolio.finance.transaction.dto.TransactionRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@DisplayName("Testes de Integração: Exportação de Relatório Mensal em PDF")
class MonthlyReportPdfIntegrationTest extends BaseIntegrationTest {

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

    private Long createCategory(String token, String name) throws Exception {
        CategoryRequest request = new CategoryRequest(name);
        MvcResult result = mockMvc.perform(post("/api/categories")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        CategoryResponse response = objectMapper.readValue(
                result.getResponse().getContentAsString(), CategoryResponse.class);
        return response.id();
    }

    private void createTransaction(String token, String desc, BigDecimal amount,
                                   LocalDate date, TransactionType type, Long catId) throws Exception {
        TransactionRequest request = new TransactionRequest(desc, amount, date, type, catId);
        mockMvc.perform(post("/api/transactions")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("Retorna 401 Unauthorized se token JWT estiver ausente")
    void returns401WhenUnauthorized() throws Exception {
        mockMvc.perform(get("/api/reports/monthly/pdf")
                        .param("year", "2026")
                        .param("month", "10"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Retorna 400 Bad Request se parâmetros de ano ou mês forem inválidos")
    void returns400WhenInvalidMonth() throws Exception {
        String token = registerAndGetToken("User Invalid Params", "invalidparam@example.test");

        mockMvc.perform(get("/api/reports/monthly/pdf")
                        .header("Authorization", "Bearer " + token)
                        .param("year", "2026")
                        .param("month", "13"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[0].field").value("month"))
                .andExpect(jsonPath("$.fieldErrors[0].message", containsString("mês deve estar entre 1 e 12")));
    }

    @Test
    @DisplayName("Regra 4: Retorna 422 quando o usuário não possui nenhum lançamento cadastrado")
    void returns422WhenUserHasNoTransactions() throws Exception {
        String token = registerAndGetToken("User Sem Lancamentos", "notransactions@example.test");

        mockMvc.perform(get("/api/reports/monthly/pdf")
                        .header("Authorization", "Bearer " + token)
                        .param("year", "2026")
                        .param("month", "10"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.message", containsString("nenhum lançamento cadastrado")));
    }

    @Test
    @DisplayName("Gera PDF com sucesso (200 OK) com headers e assinatura binária corretos")
    void generatesPdfSuccessfullyWithValidTransactions() throws Exception {
        String email = "pdfuser_" + System.currentTimeMillis() + "@example.test";
        String token = registerAndGetToken("Cliente VIP PDF", email);

        Long catTrabalho = createCategory(token, "Trabalho");
        Long catMoradia = createCategory(token, "Moradia");

        LocalDate today = LocalDate.now();
        int year = today.getYear();
        int month = today.getMonthValue();

        // 1 Receita e 1 Despesa
        createTransaction(token, "Salário CLT", new BigDecimal("7500.00"), today, TransactionType.INCOME, catTrabalho);
        createTransaction(token, "Condomínio", new BigDecimal("850.00"), today, TransactionType.EXPENSE, catMoradia);

        MvcResult result = mockMvc.perform(get("/api/reports/monthly/pdf")
                        .header("Authorization", "Bearer " + token)
                        .param("year", String.valueOf(year))
                        .param("month", String.valueOf(month)))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_PDF_VALUE))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION,
                        containsString(String.format("relatorio-financeiro-%d-%02d.pdf", year, month))))
                .andReturn();

        byte[] pdfBytes = result.getResponse().getContentAsByteArray();
        assertThat(pdfBytes).isNotEmpty();
        assertThat(pdfBytes.length).isGreaterThan(500);

        String pdfHeader = new String(pdfBytes, 0, 5, StandardCharsets.US_ASCII);
        assertThat(pdfHeader).isEqualTo("%PDF-");
    }

    @Test
    @DisplayName("B1..B5 (Integração MockMvc + Testcontainers): Dashboard de relatórios e previsões resolvem o mês mais recente com dados, cobertura em meses e séries reais")
    void dashboardAndForecastResolveLatestPeriodAndReturnConsistentMetrics() throws Exception {
        String email = "consistency_" + System.currentTimeMillis() + "@example.test";
        String token = registerAndGetToken("Empresa Consistente", email);

        // 1. Sem lançamentos: /api/reports/dashboard retorna savingsRateEvolution vazia e /api/forecast retorna balanceCoverage = null
        mockMvc.perform(get("/api/reports/dashboard")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.savingsRateEvolution").isEmpty())
                .andExpect(jsonPath("$.revenueSources").isEmpty());

        mockMvc.perform(get("/api/forecast")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.kpis.balanceCoverage").value(org.hamcrest.Matchers.nullValue()))
                .andExpect(jsonPath("$.projectionChart").isEmpty());

        // 2. Cria categoria de receita (monthlyCeiling = null, kind = INCOME) e categoria de despesa (monthlyCeiling = 50000, kind = FIXED)
        CategoryRequest revCatReq = new CategoryRequest("Faturamento SaaS", "chart-1", null, "INCOME");
        MvcResult revCatRes = mockMvc.perform(post("/api/categories")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(revCatReq)))
                .andExpect(status().isCreated())
                .andReturn();
        Long revCatId = objectMapper.readValue(revCatRes.getResponse().getContentAsString(), CategoryResponse.class).id();

        CategoryRequest expCatReq = new CategoryRequest("Folha de Pagamento & Encargos", "chart-2", new BigDecimal("50000.00"), "FIXED");
        MvcResult expCatRes = mockMvc.perform(post("/api/categories")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(expCatReq)))
                .andExpect(status().isCreated())
                .andReturn();
        Long expCatId = objectMapper.readValue(expCatRes.getResponse().getContentAsString(), CategoryResponse.class).id();

        // 3. Insere lançamentos em Out/2026 (mês passado em relação a Nov/2026):
        // Receita SaaS = 20.000, Despesa Folha = 10.000
        LocalDate octDate = LocalDate.of(2026, 10, 15);
        createTransaction(token, "Mensalidade SaaS Outubro", new BigDecimal("20000.00"), octDate, TransactionType.INCOME, revCatId);
        createTransaction(token, "Folha Outubro", new BigDecimal("10000.00"), octDate, TransactionType.EXPENSE, expCatId);
        // Lançamento INCOME vinculado a categoria de despesa (não deve aparecer em revenueSources)
        createTransaction(token, "Reembolso em Folha", new BigDecimal("1000.00"), octDate, TransactionType.INCOME, expCatId);

        // 4. GET /api/reports/dashboard sem year/month resolve automaticamente Out/2026
        mockMvc.perform(get("/api/reports/dashboard")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.monthlyIncome").value(21000.00))
                .andExpect(jsonPath("$.monthlyExpense").value(10000.00))
                .andExpect(jsonPath("$.revenueSources.length()").value(1))
                .andExpect(jsonPath("$.revenueSources[0].name").value("Faturamento SaaS"))
                .andExpect(jsonPath("$.savingsRateEvolution.length()").value(1))
                .andExpect(jsonPath("$.savingsRateEvolution[0].month").value("Out"));

        // 5. GET /api/forecast sem year/month resolve Out/2026 e calcula cobertura em meses (saldo 35.000 das contas default / 10.000 despesa = 3.5 meses)
        mockMvc.perform(get("/api/forecast")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.kpis.forecastT2").value(30000.00))
                .andExpect(jsonPath("$.kpis.balanceCoverage").value(3.5));

        // 6. GET /api/accounts e GET /api/accounts/summary possuem regularidade consistente (índice geral = média arredondada das contas)
        mockMvc.perform(get("/api/accounts/summary")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.regularityIndex").value(0));
    }
}
