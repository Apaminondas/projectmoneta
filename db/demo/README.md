# Dados de Demonstração Realistas — Nexora Soluções Cloud & B2B

Este diretório contém os scripts SQL e a documentação para geração e gerenciamento de uma **empresa de demonstração 100% realista** (`Nexora Soluções Cloud & B2B`), projetada para alimentar todas as telas do dashboard corporativo com coerência operacional, financeira e cadastral ao longo de 12 meses históricos.

---

## 1. Arquivos Entregáveis

| Arquivo | Descrição |
|---|---|
| `01_seed_demo_company.sql` | Criação completa e orientada a conjunto da empresa demo (idempotente). |
| `02_cleanup_demo_company.sql` | Remoção estrita e segura do usuário demo e seus registros filhos (ON DELETE CASCADE). |
| `03_verify_demo_company.sql` | Validações analíticas da série temporal de 12 meses, integridade referencial e métricas de Pareto por conta. |
| `COBERTURA-TELAS.md` | Mapeamento detalhado de cada seção e modal do front-end com endpoints, fórmulas do backend e lacunas catalogadas. |
| `README.md` | Guia de execução, credenciais e instruções de uso. |

---

## 2. Credenciais de Acesso à Demonstração

- **E-mail**: `empresa.demo@example.test`
- **Senha**: `Demo#2026`
- **Perfil do Usuário**: `Nexora Soluções Cloud & B2B`
- **CNPJ Fictício**: `42.108.990/0001-55` (Av. Brig. Faria Lima, 3477 - São Paulo, SP)
- **Hash de Senha**: BCrypt padrão da aplicação (`$2a$10$XNCxbTzXDrAL4IA8tLHYtun6UuzUeSfqqgjMf5/lJ8UhYbtY2zlb.`), permitindo login real pelo dashboard ou via endpoint `POST /api/auth/login`.

---

## 3. Como Executar

### Opção A: Via Docker Exec (Recomendado)
Execute os comandos a partir da raiz do projeto:

```powershell
# 1. Copiar os scripts para o contêiner do banco
docker cp db/demo finance-db:/tmp/demo

# 2. Executar a carga sintética
docker exec finance-db psql -U finance -d finance -v ON_ERROR_STOP=1 -f /tmp/demo/01_seed_demo_company.sql

# 3. Executar as verificações analíticas e de integridade
docker exec finance-db psql -U finance -d finance -v ON_ERROR_STOP=1 -f /tmp/demo/03_verify_demo_company.sql

# 4. (Opcional) Executar a limpeza da empresa demo quando desejar
docker exec finance-db psql -U finance -d finance -v ON_ERROR_STOP=1 -f /tmp/demo/02_cleanup_demo_company.sql
```

### Opção B: Via DBeaver ou Qualquer Cliente SQL
1. Conecte-se à base de dados PostgreSQL (`localhost:5433` ou porta mapeada do container, banco: `finance`, usuário: `finance`).
2. Abra o script `01_seed_demo_company.sql`.
3. Certifique-se de executar como script completo (`Alt + X` no DBeaver).
4. O script é transacional (`BEGIN ... COMMIT`) e idempotente: se executado múltiplas vezes, recria a empresa demo mantendo exatamente um único usuário cadastrado.

---

## 4. Características dos Dados Sintéticos

- **Crescimento Orgânico & Curva Realista (12 meses)**:
  - Mês 1 (Nov/2025): Receita de R$ 160.800,89 e margem de 3,8%.
  - Mês 12 (Out/2026): Receita de R$ 339.759,41 e margem de 18,3%.
  - Fator de crescimento anual de **2,11×** (dentro do intervalo estrito de 1,9× a 2,3×).
  - 3 meses com quedas mensais orgânicas (−4,3% em Dez/25, −3,7% em Abr/26 e −5,3% em Jul/26), sem nenhuma queda superior a 12%.
  - Picos sazonais de fechamento de trimestre (+12,7% em Mar/26, +12,8% em Jun/26 e +14,3% em Set/26).
  - Desvio-padrão da variação mensal de **8,20 p.p.** ($\ge 3,0\text{ p.p.}$).
  - Volume de 3.811 transações com incrementos orgânicos diferentes entre meses consecutivos.
  - Margem operacional variando organicamente entre 3,8% e 18,3%, com ruído de despesas provocando compressão de margem de 2,4 p.p. (Abr/26) e 4,6 p.p. (Jul/26).
- **Coerência Conta × Categoria**:
  - **Folha de Pagamento**: total de R$ 990.700,26 (~41% das despesas totais), sendo 92,5% concentrado na Conta Folha (R$ 916.714,39 movimentados, dentro da faixa de R$ 0,9M a 1,2M). Lançamentos por mês subindo em degraus de contratação (16 $\rightarrow$ 20 $\rightarrow$ 24 $\rightarrow$ 28 lançamentos, todos $\le 40$).
  - **Impostos & Tributos**: total de R$ 327.921,47 (12,4% da receita total), sendo 90,0% concentrado na Conta Tributos (R$ 295.006,85 movimentados, dentro da faixa de R$ 290k a 400k).
  - Despesas especializadas direcionadas às respectivas contas (CloudPulse em datacenter, Mirante Corporate em locação, SyncSuite em softwares, Cardoso & Fonseca em jurídico, PrimeAudit em auditoria).
- **Regularidade Balanceada (16 contas)**:
  - Faixa 98% (inatividade < 10 dias): 6 contas (37,5% $\le 50\%$).
  - Faixa 88% (inatividade 10..29 dias): 5 contas (31,3%).
  - Faixa 75% (inatividade 30..59 dias): 3 contas (18,8%).
  - Faixa 60% (inatividade $\ge 60$ dias): 2 contas (12,5%).
- **100% de Nomes Fictícios & Compliance Cadastral**:
  - 0 empresas ou marcas reais no banco (instituições bancárias, datacenter, clientes e auditorias com nomes fictícios plausíveis como Banco Meridional, Banco Alvorada, CloudPulse, OmniCare, Vértice Logística, PrimeAudit).
  - DDDs rigorosamente compatíveis com as UFs (SP = 11, RJ = 21, MG = 31, PR = 41).
  - Todos os e-mails com domínio corporativo `example.test`.
  - Integridade referencial com 0 violações e usuário admin intacto.
