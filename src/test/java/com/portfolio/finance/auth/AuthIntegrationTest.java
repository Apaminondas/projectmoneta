package com.portfolio.finance.auth;

import com.portfolio.finance.BaseIntegrationTest;
import com.portfolio.finance.auth.dto.LoginRequest;
import com.portfolio.finance.auth.dto.RegisterRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@DisplayName("Testes de Integração: Autenticação e Segurança")
class AuthIntegrationTest extends BaseIntegrationTest {

    @Test
    @DisplayName("Cadastro com sucesso retorna 201 e token JWT")
    void registerSuccess() throws Exception {
        RegisterRequest request = new RegisterRequest("Carlos Oliveira", "carlos@example.test", "senhaForte123");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessToken", notNullValue()))
                .andExpect(jsonPath("$.tokenType", is("Bearer")))
                .andExpect(jsonPath("$.user.email", is("carlos@example.test")))
                .andExpect(jsonPath("$.user.name", is("Carlos Oliveira")));
    }

    @Test
    @DisplayName("Cadastro com e-mail duplicado retorna 409 Conflict")
    void registerDuplicateEmailReturnsConflict() throws Exception {
        RegisterRequest initial = new RegisterRequest("Ana Souza", "ana@example.test", "senhaForte123");
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(initial)))
                .andExpect(status().isCreated());

        RegisterRequest duplicate = new RegisterRequest("Outra Ana", "ANA@example.test", "outraSenha123");
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(duplicate)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status", is(409)))
                .andExpect(jsonPath("$.message", is("E-mail já cadastrado")));
    }

    @Test
    @DisplayName("Cadastro com dados inválidos retorna 400 Bad Request")
    void registerValidationErrors() throws Exception {
        RegisterRequest invalid = new RegisterRequest("", "email-invalido", "123");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.fieldErrors", notNullValue()));
    }

    @Test
    @DisplayName("Login com credenciais válidas retorna 200 OK e token JWT")
    void loginSuccess() throws Exception {
        RegisterRequest reg = new RegisterRequest("Beatriz Lima", "beatriz@example.test", "senhaCorreta123");
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reg)))
                .andExpect(status().isCreated());

        LoginRequest login = new LoginRequest("beatriz@example.test", "senhaCorreta123");
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken", notNullValue()))
                .andExpect(jsonPath("$.user.email", is("beatriz@example.test")));
    }

    @Test
    @DisplayName("Login com senha incorreta retorna 401 Unauthorized")
    void loginInvalidPasswordReturnsUnauthorized() throws Exception {
        RegisterRequest reg = new RegisterRequest("Diego Alves", "diego@example.test", "senhaCorreta123");
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reg)))
                .andExpect(status().isCreated());

        LoginRequest login = new LoginRequest("diego@example.test", "senhaErrada999");
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status", is(401)))
                .andExpect(jsonPath("$.message", is("E-mail ou senha inválidos")));
    }

    @Test
    @DisplayName("Acesso a recurso protegido sem token retorna 401 Unauthorized padronizado")
    void protectedResourceWithoutTokenReturnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/categories"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status", is(401)))
                .andExpect(jsonPath("$.message", notNullValue()));
    }

    @Test
    @DisplayName("Acesso a recurso protegido com token inválido retorna 401 Unauthorized")
    void protectedResourceWithInvalidTokenReturnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/categories")
                        .header("Authorization", "Bearer token-invalido-123456"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status", is(401)));
    }

    @Test
    @DisplayName("C1: GET /api/users/me com token válido retorna 200 OK com id, name e email sem expor campos sensíveis")
    void getMeWithValidTokenReturnsProfileWithoutSensitiveFields() throws Exception {
        RegisterRequest reg = new RegisterRequest("Mariana Alencar", "mariana.me@example.test", "senhaSegura123");
        String body = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reg)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        String token = objectMapper.readTree(body).get("accessToken").asText();

        mockMvc.perform(get("/api/users/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.name", is("Mariana Alencar")))
                .andExpect(jsonPath("$.email", is("mariana.me@example.test")))
                .andExpect(jsonPath("$.passwordHash").doesNotExist())
                .andExpect(jsonPath("$.password").doesNotExist());
    }

    @Test
    @DisplayName("C1: GET /api/users/me sem token retorna 401 Unauthorized")
    void getMeWithoutTokenReturnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/users/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status", is(401)));
    }
}
