"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2Icon,
  DatabaseIcon,
  FileTextIcon,
  LockIcon,
  ShieldCheckIcon,
  ZapIcon,
} from "lucide-react";

const API_HIGHLIGHTS = [
  {
    value: "12",
    label: "Controllers REST",
    detail: "Domínios financeiros completos via /api/*",
  },
  {
    value: "90",
    label: "Testes Automatizados",
    detail: "17 suítes com PostgreSQL 16 em Testcontainers",
  },
  {
    value: "11",
    label: "Migrations Flyway",
    detail: "Schema versionado (V1–V11) e índices INCLUDE",
  },
  {
    value: "0",
    label: "Tokens no Navegador",
    detail: "JWT mantido exclusivamente na RAM do BFF",
  },
] as const;

const SOLUTION_PILLARS = [
  {
    icon: DatabaseIcon,
    title: "Precisão Monetária & Regras Contábeis no Domínio",
    description:
      "Valores tratados em BigDecimal e persistidos em NUMERIC(19,2) com CHECK (amount > 0) no PostgreSQL. Regras sensíveis a data usam Clock injetável para bloquear despesas futuras (422) com determinismo e impedir exclusão de categorias em uso (409).",
    tag: "BigDecimal · Rule Engine",
  },
  {
    icon: ZapIcon,
    title: "Desempenho Previsível sem N+1",
    description:
      "Consultas protegidas por @EntityGraph e índices compostos INCLUDE (V11) para agregações mensais rápidas, mantendo spring.jpa.open-in-view=false, paginação com X-Total-Count e compressão HTTP Gzip em JSON e PDF.",
    tag: "@EntityGraph · O(log n)",
  },
  {
    icon: FileTextIcon,
    title: "Emissão Executiva de PDF no Servidor",
    description:
      "Demonstrativos mensais compilados no back-end com Thymeleaf e OpenHTMLtoPDF em application/pdf, evitando renderização frágil no navegador e validando upload de logotipo (PNG/JPG até 1 MB; SVG bloqueado contra XSS).",
    tag: "OpenHTMLtoPDF · 1 MB max",
  },
] as const;

const SECURITY_CONTROLS = [
  {
    title: "BFF Zero-Token no Navegador",
    layer: "Next.js BFF",
    badge: "Sem JWT/Cookie",
    detail:
      "O cliente envia requisições apenas para /bff/* na mesma origem. O servidor gerencia o accessToken apenas em memória RAM com single-flight, renovação antecipada (60s) e nunca expõe BACKEND_URL ao navegador.",
  },
  {
    title: "Autenticação Interna BFF → API",
    layer: "BffSecretFilter",
    badge: "X-BFF-Secret",
    detail:
      "No perfil prod, toda chamada às rotas /api/** exige o header X-BFF-Secret (>= 32 caracteres) comparado em tempo constante via MessageDigest.isEqual, recusando chamadas externas diretas com 403.",
  },
  {
    title: "Isolamento Multi-Tenant Anti-Enumeração",
    layer: "Repositórios JPA",
    badge: "404 Not Found",
    detail:
      "Todas as queries filtram estritamente pelo userId do principal autenticado (findByIdAndUserId). Tentativas de acessar recursos de terceiros respondem 404 em vez de 403 para não vazar IDs válidos.",
  },
  {
    title: "Modo Readonly em Duas Camadas & Cadastro Fechado",
    layer: "DemoReadOnlyFilter",
    badge: "403 DEMO_READ_ONLY",
    detail:
      "Além do bloqueio no BFF, em produção a API ativa DemoReadOnlyFilter na camada Servlet para mutações da conta demo e desabilita POST /api/auth/register (403 Forbidden), impedindo contorno direto.",
  },
  {
    title: "Endurecimento de Borda & Superfície Mínima",
    layer: "SecurityConfig + Next",
    badge: "CSP · CSRF · CORS",
    detail:
      "Swagger/OpenAPI desativados em prod, Actuator restrito a /actuator/health (show-details: never), CORS sem wildcard (*), allowlist estrita de 11 recursos no BFF, proteção anti-traversal/SSRF, verificação Origin/Sec-Fetch-Site, CSP e HSTS.",
  },
] as const;

interface SettingsApiTabProps {
  isApiHealthy?: boolean;
}

export function SettingsApiTab({ isApiHealthy }: SettingsApiTabProps) {
  return (
    <div className="space-y-6">
      {/* Proposta de valor da API como solução corporativa */}
      <Card className="border-border bg-card rounded-2xl">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-base font-semibold text-foreground">
                  Moneta API REST — Núcleo Financeiro Corporativo
                </CardTitle>
                <Badge className="bg-secondary text-foreground border border-border text-xs rounded-lg font-mono">
                  Java 17 · Spring Boot 3.5
                </Badge>
              </div>
              <CardDescription className="text-xs text-muted-foreground max-w-[56ch] leading-relaxed">
                Engine financeira stateless construída para confiabilidade contábil, isolamento entre contas e operação segura com PostgreSQL 16.
              </CardDescription>
            </div>

            <Badge
              className={
                isApiHealthy
                  ? "bg-success/15 text-success border-success/35 text-xs rounded-lg shrink-0"
                  : "bg-secondary text-muted-foreground border-border text-xs rounded-lg shrink-0"
              }
            >
              <CheckCircle2Icon className="w-3.5 h-3.5 mr-1" strokeWidth={1.5} />
              {isApiHealthy ? "Perfil ativo · API saudável" : "Arquitetura pronta para prod"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Métricas verificáveis sem caixas aninhadas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 pt-2 pb-5 border-b border-border">
            {API_HIGHLIGHTS.map((item) => (
              <div key={item.label} className="space-y-1">
                <p className="text-2xl font-semibold tracking-tight text-accent tabular-nums">
                  {item.value}
                </p>
                <p className="text-xs font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.detail}</p>
              </div>
            ))}
          </div>

          {/* Diferenciais técnicos como solução */}
          <div className="divide-y divide-border">
            {SOLUTION_PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.title}
                  className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-4 h-4 text-accent" strokeWidth={1.5} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold text-foreground">{pillar.title}</h3>
                      <p className="text-xs text-muted-foreground max-w-[54ch] leading-relaxed">
                        {pillar.description}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-xs text-muted-foreground shrink-0 sm:pt-0.5">
                    {pillar.tag}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Arquitetura e Controles de Segurança */}
      <Card className="border-border bg-card rounded-2xl">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-secondary border border-border flex items-center justify-center shrink-0">
                <ShieldCheckIcon className="w-4 h-4 text-success" strokeWidth={1.5} />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-foreground">
                  Segurança em Camadas & Blindagem de Produção
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground max-w-[65ch]">
                  Defesa em profundidade cobrindo navegador, proxy BFF, filtros Spring Security e persistência relacional
                </CardDescription>
              </div>
            </div>
            <Badge className="bg-success/15 text-success border-success/35 text-xs rounded-lg font-mono w-fit">
              <LockIcon className="w-3 h-3 mr-1" strokeWidth={1.5} />
              JWT HS256 + X-BFF-Secret
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          <div className="divide-y divide-border">
            {SECURITY_CONTROLS.map((control, index) => (
              <div
                key={control.title}
                className="py-4 first:pt-0 last:pb-0 flex flex-col lg:flex-row lg:items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-accent tabular-nums">
                      0{index + 1}
                    </span>
                    <h3 className="text-sm font-semibold text-foreground">{control.title}</h3>
                    <span className="font-mono text-xs text-muted-foreground">
                      · {control.layer}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground max-w-[54ch] leading-relaxed">
                    {control.detail}
                  </p>
                </div>

                <Badge className="bg-secondary text-foreground border border-border text-xs rounded-lg font-mono w-fit shrink-0">
                  {control.badge}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
