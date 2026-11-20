# 📚 Documentação do Projeto — Moneta & Dashboard

Bem-vindo à documentação central do projeto **Moneta & Dashboard Corporativo**. Todos os documentos técnicos, padrões arquiteturais, especificações de design e planos de execução estão organizados nesta pasta.

---

## 🗂️ Estrutura de Documentação

### 1. 🏛️ Arquitetura & Produto (`docs/architecture/`)
Padrões de desenvolvimento do back-end, convenções de código e regras de negócio.
- **[BACKEND-PADROES.md](architecture/BACKEND-PADROES.md)**: Guia de arquitetura Spring Boot 3, convenções de controllers, services, repositories, DTOs, migrations Flyway, testes JUnit e tratamento global de erros.
- **[PRODUCT.md](architecture/PRODUCT.md)**: Visão geral do produto, proposta de valor corporativa B2B, personas e mapa de funcionalidades.

### 2. 🎨 Design & Interface (`docs/design/`)
Diretrizes visuais, tokens, componentes e integridade de UI.
- **[DESIGN-SYSTEM.md](design/DESIGN-SYSTEM.md)**: Especificação completa de tokens de cor, tipografia, espaçamentos, hierarquia visual, microinterações e catálogo de componentes reutilizáveis (`components/ui`).
- **[DESIGN-LOCK.md](design/DESIGN-LOCK.md)**: Regras de integridade visual e blindagem do template (zero introdução de classes arbitrárias fora do design system).

### 3. 📋 Planejamento & Qualidade (`docs/planning/`)
Roadmaps de implementação, auditorias e histórico de verificações.
- **[PLANO-DE-EXECUCAO.md](planning/PLANO-DE-EXECUCAO.md)**: Plano faseado de implementação das funcionalidades (F-01 a F-08), com dependências, esforço e prompts prontos.
- **[BACKLOG-FUNCIONAL.md](planning/BACKLOG-FUNCIONAL.md)**: Mapeamento completo de telas, componentes interativos, endpoints correspondentes e status de cobertura.
- **[AUDITORIA-INTEGRACAO.md](planning/AUDITORIA-INTEGRACAO.md)**: Diário de bordo detalhado de auditorias, verificações do Impeccable, testes ponta a ponta e histórico de integração.

### 4. ⚡ Prompts & Automações (`docs/prompts/`)
Comandos e prompts estruturados para uso com agentes de IA.
- **[PROMPTS-ANTIGRAVITY.md](prompts/PROMPTS-ANTIGRAVITY.md)**: Conjunto de prompts pré-configurados para desenvolvimento de cada tela e funcionalidade no padrão do projeto.
- **[Prompt 1.md](prompts/Prompt%201.md)**: Registro do prompt inicial de setup e requisitos de integração.

---

## 🧭 Como Usar esta Documentação

1. **Ao implementar novas funcionalidades no back-end:** Consulte [BACKEND-PADROES.md](architecture/BACKEND-PADROES.md).
2. **Ao criar ou ajustar componentes no front-end:** Consulte [DESIGN-SYSTEM.md](design/DESIGN-SYSTEM.md) e [DESIGN-LOCK.md](design/DESIGN-LOCK.md).
3. **Ao planejar a próxima entrega ou sprint:** Consulte [PLANO-DE-EXECUCAO.md](planning/PLANO-DE-EXECUCAO.md) e [BACKLOG-FUNCIONAL.md](planning/BACKLOG-FUNCIONAL.md).
