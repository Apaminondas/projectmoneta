package com.portfolio.finance.security;

import com.portfolio.finance.BaseIntegrationTest;
import com.portfolio.finance.auth.dto.LoginRequest;
import com.portfolio.finance.auth.dto.RegisterRequest;
import com.portfolio.finance.category.dto.CategoryRequest;
import com.portfolio.finance.user.User;
import com.portfolio.finance.user.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ActiveProfiles({"test", "prod"})
@TestPropertySource(properties = {
        "app.security.bff-secret=test-bff-shared-secret-minimum-32-chars",
        "app.demo.email=demo@moneta.local"
})
@DisplayName("Testes de Integração: Blindagem de Produção (BFF secret, register off, demo readonly)")
class ProdSecurityHardeningIntegrationTest extends BaseIntegrationTest {

    private static final String BFF_SECRET = "test-bff-shared-secret-minimum-32-chars";

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Test
    @DisplayName("Bloqueia chamadas /api/** sem X-BFF-Secret válido, mas mantém /actuator/health acessível")
    void requiresBffSecretOnApiRoutesAndExemptsHealth() throws Exception {
        mockMvc.perform(get("/api/categories"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message", is("Acesso direto não autorizado")));

        mockMvc.perform(post("/api/auth/login")
                        .header(BffSecretFilter.HEADER_NAME, "wrong-secret")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest("demo@moneta.local", "x"))))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("UP")));
    }

    @Test
    @DisplayName("Desabilita cadastro público em produção mesmo com X-BFF-Secret válido")
    void registerIsDisabledInProd() throws Exception {
        RegisterRequest request = new RegisterRequest("Visitante", "visitante@example.test", "SenhaForte#123");

        mockMvc.perform(post("/api/auth/register")
                        .header(BffSecretFilter.HEADER_NAME, BFF_SECRET)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Usuário demo autenticado pode ler, mas tem escritas bloqueadas na própria API")
    void demoUserCanReadButCannotMutateInProd() throws Exception {
        User demo = userRepository.findByEmailIgnoreCase("demo@moneta.local")
                .orElseGet(() -> userRepository.save(new User(
                        "Demo",
                        "demo@moneta.local",
                        passwordEncoder.encode("DemoProd#2026")
                )));
        String demoToken = jwtService.generateToken(demo.getId(), demo.getEmail());

        mockMvc.perform(get("/api/categories")
                        .header(BffSecretFilter.HEADER_NAME, BFF_SECRET)
                        .header("Authorization", "Bearer " + demoToken))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/categories")
                        .header(BffSecretFilter.HEADER_NAME, BFF_SECRET)
                        .header("Authorization", "Bearer " + demoToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CategoryRequest("Tentativa Direta"))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code", is("DEMO_READ_ONLY")))
                .andExpect(jsonPath("$.status", is(403)));
    }

    @Test
    @DisplayName("Usuário não-demo autenticado mantém permissão de escrita via BFF")
    void nonDemoUserRetainsWriteAccessWhenAuthenticatedViaBff() throws Exception {
        String email = "prod-standard-user@example.test";
        if (!userRepository.existsByEmailIgnoreCase(email)) {
            userRepository.save(new User("Prod User", email, passwordEncoder.encode("ProdUser#2026")));
        }

        String loginResponse = mockMvc.perform(post("/api/auth/login")
                        .header(BffSecretFilter.HEADER_NAME, BFF_SECRET)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest(email, "ProdUser#2026"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken", notNullValue()))
                .andReturn()
                .getResponse()
                .getContentAsString();

        String token = objectMapper.readTree(loginResponse).get("accessToken").asText();

        mockMvc.perform(post("/api/categories")
                        .header(BffSecretFilter.HEADER_NAME, BFF_SECRET)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CategoryRequest("Categoria Autorizada"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name", is("Categoria Autorizada")));
    }
}

