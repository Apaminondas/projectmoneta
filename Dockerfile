# Multi-stage Dockerfile para moneta-api

# Etapa 1: Build
FROM eclipse-temurin:17-jdk AS builder
WORKDIR /workspace

# Cache de dependências
COPY pom.xml mvnw ./
COPY .mvn .mvn/
RUN chmod +x ./mvnw && ./mvnw dependency:go-offline -B || true

# Compilação e empacotamento
COPY src src/
RUN ./mvnw clean package -DskipTests -B

# Etapa 2: Runtime enxuto e seguro (não-root)
FROM eclipse-temurin:17-jre
WORKDIR /app

RUN groupadd -r appgroup && useradd -r -g appgroup appuser

COPY --from=builder /workspace/target/moneta-api.jar app.jar

USER appuser:appgroup

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
