# Avelon Platform — Arquitetura

> Documento de referência oficial da arquitetura da Avelon. Toda decisão de
> implementação, presente ou futura, deve ser compatível com o que está aqui.
> Alterações neste documento representam uma decisão arquitetural e devem ser
> registradas na seção 12 (Decisões Arquiteturais) antes de qualquer código.

**Versão:** 1.1 — Fase 0/1 concluída (fundação de dados)
**Status:** Aprovado · Schema definitivo aplicado

---

## 1. Visão geral

A Avelon não é um CRM. É uma **plataforma SaaS para imobiliárias**, na qual o
CRM é o primeiro módulo comercializado. A plataforma é composta por dois
painéis com fronteiras de autenticação totalmente independentes:

- **Avelon Platform** — painel interno, uso exclusivo da equipe Avelon. Vê
  toda a infraestrutura técnica, todos os clientes, toda a operação.
- **Avelon CRM** (e futuros módulos) — painel comercial, uso das imobiliárias
  clientes. Vê apenas dados comerciais do próprio tenant, em linguagem
  comercial, sem qualquer exposição de tecnologia interna.

A plataforma é multi-tenant, multi-organização, multi-módulo e desenhada para
crescer sem exigir refatoração estrutural a cada novo módulo, papel ou canal.

---

## 2. Princípios da arquitetura

1. **Isolamento não é visual, é estrutural.** Nenhuma garantia de segurança ou
   de separação de dados pode depender de "esconder algo na tela". Toda
   fronteira (tenant, papel, camada técnica/comercial) é aplicada no servidor,
   na query e no DTO de resposta.
2. **O cliente nunca vê a tecnologia por trás.** Nenhum termo técnico
   (webhook, token, secret, API, banco de dados, framework, nome de
   ferramenta de automação) chega a uma tela ou payload de resposta
   consumido pelo tenant.
3. **A fundação nasce maior do que a V1 usa.** Tabelas e abstrações que são
   baratas de criar agora e caras de retrofitar depois (Organization,
   Workspace, Feature, Permission, evento de domínio) entram no schema desde
   o início, mesmo que a funcionalidade correspondente só exista em versões
   futuras.
4. **Papéis simples agora, permissões granulares por baixo.** A V1 opera com
   3 papéis fixos, mas a checagem de acesso nunca é `if (role === "X")`
   espalhada pelo código — é sempre resolução de permissão a partir de dado,
   permitindo novos papéis sem alterar lógica.
5. **Eventos de domínio existem desde já, mesmo sem fila.** Toda ação
   relevante (lead criado, lead movido, mensagem recebida) é emitida como
   evento nomeado, ainda que a V1 apenas a processe de forma síncrona e
   direta.
6. **IA é serviço de plataforma, não feature de módulo.** Quando implementada,
   é consumida por qualquer módulo através de uma interface única.
7. **Toda decisão de adiar algo é registrada, não apenas esquecida.**

---

## 3. Hierarquia da plataforma

```
Avelon (empresa)
 └─ AvelonStaff (equipe interna, autenticação própria)

Organization (grupo imobiliário — unidade comercial/faturamento)
 └─ Tenant (imobiliária — unidade de isolamento de dados)
     └─ Workspace (área operacional livre: Vendas, Locações, Equipe Norte...)
         └─ User (Owner, Manager, Corrector — e futuros papéis)
             └─ Lead
                 ├─ BusinessChannel (canal comercial visível ao tenant)
                 ├─ Campaign (campanha dentro de um canal)
                 └─ TechnicalSource (mecanismo técnico real — só Avelon vê)
```

Regras de contenção:

- Uma `Organization` pode conter múltiplos `Tenant`, mas dados **nunca** são
  agregados entre tenants numa mesma resposta.
- Todo `Tenant` pertence a exatamente uma `Organization` (1:1 na V1 — schema
  já suporta N:1).
- Todo `Tenant` nasce com um `Workspace` padrão (`isDefault = true`).
- `tenantId`/`workspaceId` **nunca** vêm do cliente — sempre derivados da
  sessão, no servidor.

---

## 4. Modelagem de dados definitiva (Fase 0/1)

Esta seção documenta o schema Prisma aplicado nesta fase. Arquivos de
referência: `prisma/schema.prisma`, `prisma/seed.ts`,
`prisma/scripts/backfill-foundation.ts`.

### 4.1 Identidade

| Modelo | Papel |
|---|---|
| `AvelonStaff` | Equipe interna Avelon. Sem `tenantId`. Login e sessão totalmente separados do tenant. |
| `Organization` | Unidade comercial/faturamento; agrupa 1+ `Tenant`. |
| `Tenant` | Unidade de isolamento de dados (a imobiliária). Pertence a uma `Organization`. |
| `Workspace` | Área operacional dentro do tenant, nome livre. V1: um único workspace padrão por tenant. |
| `User` | Usuário da imobiliária. Pertence a `Tenant` + `Workspace`. Campo `managerId` (auto-relação `UserManager`) permite hierarquia de equipe (Manager → Correctors). Papel: `OWNER \| MANAGER \| CORRECTOR`. |

### 4.2 Contratação

| Modelo | Papel |
|---|---|
| `Module` | Catálogo amplo: CRM, IA, BI, API_PUBLICA, MARKETPLACE, FINANCEIRO, DOCUMENTOS, CONTRATOS, MARKETING. |
| `Feature` | Capacidade granular dentro de um módulo (ex: `CRM_LEADS`, `CRM_KANBAN`, `IA_ASSISTENTE`). |
| `Plan` | Catálogo comercial: Starter, Professional, Enterprise. |
| `PlanFeature` | O que cada plano libera por padrão. |
| `Subscription` | Vínculo `Tenant ↔ Plan`, com status (`TRIAL/ACTIVE/PAST_DUE/CANCELED`). |
| `TenantFeatureOverride` | Exceção pontual por tenant, além do plano contratado. |

Resolução em runtime (a ser implementada na camada de serviço, fora do
escopo desta fase): `hasFeature(tenantId, featureKey)` → checa
`TenantFeatureOverride` primeiro, depois `Subscription → Plan → PlanFeature`.

### 4.3 Permissões

| Modelo | Papel |
|---|---|
| `Permission` | Catálogo granular (`leads.view_all`, `leads.view_own`, `reports.view_global`, `users.manage`...). |
| `RolePermission` | O que cada `UserRole` concede. Populado via seed para os 3 papéis da V1. |

Novo papel em V2 = novas linhas em `RolePermission`, sem alterar código de
checagem (`hasPermission(user, key)`).

### 4.4 Origem do lead — três camadas

| Modelo | Visível para | Exemplo |
|---|---|---|
| `TechnicalSource` | Avelon Staff | `kind: "TYPEBOT_IMOVEIS"`, `"MAKE_SITE"`, `"FACEBOOK_LEADS"`, `"WHATSAPP"` |
| `BusinessChannel` | Tenant | `type: WHATSAPP \| INSTAGRAM \| FACEBOOK \| GOOGLE \| SITE \| LANDING_PAGE \| CHAT_SITE \| PORTAL \| INDICACAO \| CAMPANHA \| MANUAL \| OUTRO` |
| `Campaign` | Tenant (criação livre) | "Landing Page Riviera", "Campanha Alto Padrão - Julho" |

`TechnicalSource.businessChannelId` é o mapeamento configurado pela Avelon —
um mesmo canal comercial pode ser alimentado por mais de uma origem técnica.
`Lead` grava as três pontas: `technicalSourceId` (interno, nunca serializado
ao tenant), `businessChannelId` e `campaignId` (visíveis).

`IntegrationWebhook`, `FacebookPageConfig` e `WhatsAppConfig` — que carregam
secret/token — agora referenciam `TechnicalSource`, não mais o antigo
`IntegrationSource` (removido/substituído nesta fase).

`LeadDistributionRule` passa a referenciar `businessChannelId` (FK) no lugar
do antigo campo solto `leadSourceKey` (string).

### 4.5 Observabilidade interna

| Modelo | Papel |
|---|---|
| `AuditLog` | Toda ação sensível — de `AvelonStaff` ou de `User` — sobre dado de tenant. Nunca silencioso. |
| `IntegrationHealthLog` | Status/erro de integração técnica por tenant, por `TechnicalSource`. |
| `DomainEventLog` | Registro de evento de domínio emitido (`lead.created`, `lead.moved`, `whatsapp.message.received`...). V1: consumo síncrono e direto; o log existe para auditoria e para permitir trocar a implementação por um broker real em V2 sem alterar pontos de chamada. |

---

## 5. Autenticação e autorização

### 5.1 Dois domínios de identidade, nunca um

- **Sessão de Tenant**: NextAuth Credentials + JWT. Carrega
  `{ userId, tenantId, workspaceId, role }`. Login em `/login`.
- **Sessão Avelon Staff**: provider separado, tabela `AvelonStaff`, cookie de
  sessão com nome diferente. Carrega `{ staffId, staffRole }` — **nunca
  `tenantId`**. Login em `/staff/login`.

Middleware único decide, pelo prefixo de rota, qual sessão é exigida.
Acesso da Avelon a dado de tenant específico é sempre explícito
(`/api/admin/tenants/:id/**`) e gravado em `AuditLog`.

> **Hardening planejado para V2:** separação por subdomínio. V1 resolve via
> prefixo de rota + middleware.

### 5.2 Roles → Permissions

Ver seção 4.3. Checagem sempre via `hasPermission`, nunca comparação direta
de role no código de rota.

### 5.3 Escopo de dado por papel (aplicado no servidor)

- `CORRECTOR` → filtro automático `assignedToUserId = session.user.id`
- `MANAGER` → filtro automático `assignedToUserId IN (User.directReports do gestor)`, usando `User.managerId`
- `OWNER` → sem filtro adicional além de `tenantId`

Centralizado em uma única função de resolução de escopo (a ser implementada
na Fase 5 do plano de implementação), usada por toda rota que lê lead,
tarefa, agenda ou relatório.

---

## 6. Arquitetura orientada a eventos (fundação, sem broker)

`DomainEventLog` + função `emitDomainEvent(type, payload)` (a ser
implementada na camada de serviço). V1 não introduz fila ou broker — o
"consumo" continua sendo chamada de função direta e síncrona. Troca por
processamento assíncrono real é decisão de implementação futura, não de
schema.

---

## 7. IA como serviço transversal

Reservada no catálogo (`Module.IA`, `Feature.IA_ASSISTENTE`), sem
implementação. Interface de serviço (`server/services/ai/`) é decisão de
código futuro, não desta fase.

---

## 8. Padrões adotados

- **DTO explícito em toda resposta de API de tenant.**
- **Escopo derivado da sessão, nunca do request.**
- **Uma função central de resolução de escopo e de permissão.**
- **Toda integração técnica nova segue o padrão:** `TechnicalSource`
  configurado pela Avelon → mapeamento para `BusinessChannel` → mesmo
  serviço central de criação de lead.
- **Toda ação sensível da Avelon sobre dado de tenant é auditada.**

---

## 9. Convenções

- Rotas do painel interno sempre sob `/staff/**` (UI) e `/api/admin/**`
  (API).
- Nomes técnicos só podem aparecer em código, `server/integrations/**`,
  `TechnicalSource` e telas sob `/staff/**`.
- Todo modelo de dado de tenant carrega `tenantId` obrigatório e indexado.
- Todo endpoint novo usa a checagem de sessão + resolução de
  permissão/escopo central — nunca checagem ad-hoc.

---

## 10. Módulos existentes e planejados

| Módulo | Status |
|---|---|
| CRM | Implementado (V1, em andamento — Fase 0/1 concluída) |
| Financeiro, Documentos, Contratos, Marketing, IA, BI, API Pública, Marketplace | Catálogo reservado, sem implementação |

---

## 11. Estratégia de crescimento

- Novo módulo → nova entrada em `Module`/`Feature`, novo conjunto de rotas,
  sem alterar hierarquia de tenant/organization.
- Novo papel → novas linhas em `RolePermission`, sem alterar código.
- Novo canal comercial → nova linha em `BusinessChannel`, sem alterar schema.
- Nova integração técnica → novo `TechnicalSource` + mapeamento, reaproveita
  o mesmo serviço central de criação de lead.
- Processamento assíncrono real → troca de implementação por trás de
  `emitDomainEvent`, sem alterar pontos de chamada.
- Múltiplos workspaces ativos → ativação de seletor de UI + escopo adicional
  na função central de resolução de escopo, sem migration estrutural.

---

## 12. Decisões arquiteturais (registro)

| # | Decisão | Motivo | Revisitar em |
|---|---|---|---|
| 1 | Organization 1:1 com Tenant permitido desde já | Barato agora, caro de retrofitar depois | V2 |
| 2 | Workspace único e automático por tenant na V1 | Multi-workspace completo não é necessário agora | V2 |
| 3 | Feature Flags como catálogo, só módulo CRM ativo | Evita lógica ad-hoc no futuro | V2 |
| 4 | Permissions por RolePermission, só 3 papéis povoados | Troca de padrão de checagem é barata agora | V2 |
| 5 | Evento de domínio síncrono, sem broker | Infraestrutura de fila desproporcional ao estágio atual | V2 |
| 6 | IA sem implementação, só catálogo reservado | Evita featurinha isolada que compromete o posicionamento transversal | V2 |
| 7 | Autenticação Avelon separada por prefixo de rota, não subdomínio | Suficiente para isolamento de sessão na V1 | V2 |
| 8 | `UserRole.ADMIN` renomeado para `OWNER` | Alinhar nomenclatura com a hierarquia comercial (Owner/Manager/Corrector) definida nesta fase | — |
| 9 | `IntegrationSource` removido, substituído por `TechnicalSource` + `BusinessChannel` | Elimina o modelo que misturava identificador técnico e rótulo comercial — causa raiz do vazamento de informação técnica ao cliente | — |
| 10 | `LeadDistributionRule.leadSourceKey` (string solta) substituído por `businessChannelId` (FK) | Distribuição é configuração comercial; deve referenciar entidade comercial, não string técnica | — |

---

## 13. Status da Fase 0/1

**Concluído nesta fase:**
- Schema Prisma definitivo aplicado (`prisma/schema.prisma`)
- Script de migração de dados legados (`prisma/scripts/backfill-foundation.ts`) —
  **dormente**, ver nota de procedimento abaixo
- Seed inicial completo (`prisma/seed.ts`), revisado e **100% idempotente**
  (todo registro usa id fixo + `upsert`; rodar o seed múltiplas vezes não
  duplica campanha, lead, tarefa, movimento ou qualquer outro registro)
- Este documento atualizado

**Procedimento de migração adotado nesta fase:** como não havia dado real de
tenant em produção no momento da Fase 0/1, o procedimento escolhido foi
`npx prisma migrate reset` (recria o banco do zero e roda o seed
automaticamente) — **não** o `backfill-foundation.ts`. O script de backfill
permanece no repositório como infraestrutura reservada para uma futura
mudança estrutural equivalente a esta, no momento em que já existirem
tenants reais em produção.

**Explicitamente fora do escopo desta fase** (fases seguintes do plano de
implementação aprovado):
- Autenticação Avelon Staff (Fase 2)
- Endpoints técnicos movidos para `/api/admin/**` (Fase 4)
- Escopo de dado por papel aplicado nas rotas (Fase 5)
- Gate funcional de `Subscription`/`Feature` (Fase 6)
- Painel interno Avelon (Fase 7)

*Nenhuma API, tela ou funcionalidade foi implementada nesta fase — apenas
fundação de dados, conforme solicitado.*

---

## 14. Status da Fase 2 — Autenticação Avelon Staff

**Concluído:** dois domínios de identidade totalmente isolados —
`AvelonStaff` (login `/staff/login`, secret `STAFF_NEXTAUTH_SECRET`,
cookies `avelon-staff-*`) e `User`/Tenant (login `/login`,
`NEXTAUTH_SECRET`, cookies padrão do NextAuth). `SessionProvider` do
tenant isolado em `app/(tenant)/layout.tsx`; `app/layout.tsx` (raiz) é
puramente estrutural. Middleware protege `/staff/**` e `/api/admin/**`
via `getToken` com secret/cookie próprios do staff, sem `withAuth` (que
assumiria um único secret global para os dois domínios). Checklist de
validação entregue em `CHECKLIST-fase-2.md`.

## 15. Modelo de governança e autonomia de execução

A partir da Fase 2, o desenvolvimento passou a operar por **sprints com
autonomia técnica**, substituindo o modelo anterior de aprovação a cada
pequeno passo. Isso é uma decisão de **processo**, não de arquitetura —
registrada aqui porque afeta como toda decisão futura é tomada e
documentada.

**Autonomia concedida:** correção de inconsistência arquitetural,
melhoria de segurança/performance/tipagem/organização, eliminação de
duplicação, fortalecimento do isolamento Platform/CRM, documentação,
testes, e preparação de evolução futura que não aumente
significativamente a complexidade da V1 — tudo isso é implementado
diretamente, sem pedido de aprovação prévia.

**Gatilho de interrupção obrigatório:** qualquer decisão que altere
arquitetura principal, modelo de dados, regra de negócio, experiência do
usuário, modelo comercial, segurança da plataforma, ou que gere risco
real de retrabalho significativo — nesses casos, o desenvolvimento para e
a decisão é levada explicitamente antes de codar.

**Formato de entrega:** cada sprint fecha com relatório padronizado
(resumo, arquivos alterados, decisões tomadas, justificativas, riscos,
checklist, próximos passos) — ver `ENGINEERING_GUIDE.md` para o formato
exato e os princípios de engenharia que orientam toda decisão tomada sob
esse modelo.

---

## 16. Distribution Strategy — roadmap oficial

`LeadDistributionRule.mode` já é, desde a Fase 0/1, o lugar certo para
representar **estratégia de distribuição** por tenant. Esta seção
formaliza o conceito completo e registra o roadmap, sem alterar o schema
nesta sprint — adicionar uma estratégia nova no catálogo é migration
aditiva (novo valor de enum + novo branch no resolver), nunca redesenho
estrutural de `LeadDistributionRule`.

### Estratégias implementadas na V1

| Valor (`DistributionMode`) | Comportamento |
|---|---|
| `MANUAL` | Lead fica sem atribuição automática; Owner/Manager atribui manualmente |
| `BY_CITY` | Regra filtra por cidade/bairro, atribui a um corretor fixo da regra |
| `BY_CORRECTOR` | Regra aponta diretamente para um corretor responsável |
| `ROUND_ROBIN` | Rodízio entre uma lista de corretores, por ordem |

### Estratégias registradas no roadmap (V2+, não implementadas)

| Estratégia | Conceito adicional que vai exigir |
|---|---|
| Pool de Leads | Campo `Lead.poolStatus` (ou tabela `LeadPool`) — lead visível a qualquer corretor autorizado até ser "assumido" |
| Pool de Plantão | `User.isOnDuty` (ou tabela `DutySchedule`) — só corretor em plantão vê/assume o pool |
| Por especialidade | Vínculo `User ↔ Specialty` (tipo de imóvel, segmento) |
| Por região/cidade | Já parcialmente coberto por `BY_CITY`; pode evoluir para regra multi-cidade por corretor |
| Por performance | Depende de métrica agregada de conversão por corretor — só faz sentido após `IntegrationHealthLog`/analytics amadurecerem |
| Por equipe | Usa `User.managerId` já existente — atribui ao gestor da equipe cuja fila está mais vazia |
| Híbrida | Composição de duas estratégias (ex: parte round-robin, parte pool) — exige `LeadDistributionRule` suportar regras encadeadas, não uma só por match |
| Personalizada | Estratégia definida pelo próprio tenant — mais distante, provavelmente exige motor de regras mais expressivo que o atual |

### Decisão de escopo — redistribuição por Manager (Fase 5)

Manager pode redistribuir lead para **qualquer corretor do tenant**, não
só da própria equipe — decisão de negócio explícita, registrada aqui
porque afeta o resolver de escopo (§17). O escopo de **visualização** de
Manager continua restrito à própria equipe (ver §17); a permissão de
**distribuição** é deliberadamente mais ampla que a de leitura, refletindo
o papel operacional do Manager na organização dos leads do tenant como um
todo.

## 17. Escopo de dado por papel — implementação (Fase 5)

Formalizado em `server/services/access/resolveLeadScope.ts` +
`server/services/access/permissions.ts`. Resolução:

- `OWNER` → nenhum filtro além de `tenantId` (já aplicado em toda rota)
- `MANAGER` → `assignedToUserId IN (managerId, diretos via User.managerId)
  OR assignedToUserId IS NULL` — inclui leads não atribuídos, porque o
  Manager precisa enxergá-los para poder distribuí-los
- `CORRECTOR` → `assignedToUserId = próprio id` — não vê fila de não
  atribuídos (reservado para a futura estratégia de Pool)

Permissão de ação (`leads.distribute`, `reports.view_global`, etc.)
resolvida via `hasPermission(role, key)`, consultando `RolePermission` —
nunca comparação direta de `role` nas rotas, conforme
`ENGINEERING_GUIDE.md`.

---

## 18. Status da Fase 6 — Gate funcional de Subscription/Feature

Implementado `hasFeature(tenantId, featureKey)` e `hasAnyCrmFeature(tenantId)`
em `server/services/access/features.ts`, com cache por tenant (TTL 60s) e
resolução `TenantFeatureOverride → Subscription (status ACTIVE/TRIAL) →
Plan → PlanFeature`.

**Ponto de aplicação único**: `app/(tenant)/(dashboard)/layout.tsx`. Não
foi aplicado rota a rota — na V1, com um único módulo (CRM) vendido a
todo tenant ativo, gatear cada endpoint individualmente seria
complexidade sem benefício observável agora. O layout do CRM é o ponto
de menor superfície que já bloqueia 100% do módulo caso a assinatura
não esteja ativa, e é o mesmo padrão de "checagem centralizada" já usado
para autenticação (`requireTenantUser`) — quando um segundo módulo
existir de fato, o gate por rota/feature específica passa a fazer
sentido e é aditivo sobre o que já existe aqui.

**Sprint 3 (débito técnico) e Sprint 4 (Fase 6) concluídas.** Próxima
etapa do roadmap: Fase 7 — painel interno Avelon (gestão de tenants,
organizations, integrações técnicas movidas, auditoria).
