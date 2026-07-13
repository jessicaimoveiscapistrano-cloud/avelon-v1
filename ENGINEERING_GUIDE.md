# Avelon — Engineering Guide

> Guia permanente de engenharia. Vale para todo código escrito na
> plataforma, presente e futuro. Onde este guia e o `ARCHITECTURE.md`
> parecerem conflitar, `ARCHITECTURE.md` vence em decisão estrutural;
> este guia vence em convenção de como escrever o código do dia a dia.

## Princípios inegociáveis

1. **Nunca expor detalhe técnico ao cliente.** Nenhum termo de
   infraestrutura (webhook, token, secret, API, banco, framework, nome de
   ferramenta de automação) chega a uma tela ou payload de resposta
   consumido pelo tenant. Isso vale para texto de UI, mensagem de erro,
   nome de campo em DTO e log visível ao cliente.
2. **Avelon Platform e Avelon CRM são dois produtos, não um produto com
   um admin a mais.** Autenticação, sessão, cookies, secrets, layouts e
   rotas são fisicamente separados. Nenhum componente de um lado importa
   algo do outro por conveniência.
3. **Isolamento de tenant é absoluto.** `tenantId` nunca vem do cliente —
   sempre da sessão, resolvido no servidor. Nenhuma query agrega dado de
   dois tenants numa mesma resposta, mesmo dentro da mesma Organization.
4. **Segurança antes de conveniência.** Entre "mais rápido de implementar"
   e "mais seguro", vence segurança — exceto quando isso significaria
   aumentar o escopo da V1, caso em que a decisão é registrada como
   pendência de V2, não ignorada silenciosamente.
5. **Escalabilidade de fundação, simplicidade de superfície.** Schema e
   abstrações nascem preparados para crescer (ver `ARCHITECTURE.md` §2.3);
   a V1 usa o mínimo necessário dessas abstrações. Não implementar
   funcionalidade "porque a tabela já existe".
6. **Zero duplicação de lógica de negócio.** Regra de distribuição de
   lead, resolução de permissão, resolução de escopo por papel, resolução
   de canal comercial — cada uma vive em exatamente um lugar
   (`server/services/**`), nunca reimplementada localmente numa rota.
7. **Baixo acoplamento, alta coesão.** Uma rota de API não sabe como o
   Prisma está modelado por baixo de um serviço; um componente de UI não
   sabe de onde veio o dado, só do formato do DTO que recebeu.
8. **Toda decisão importante é registrada, não só lembrada.** Decisão
   arquitetural nova → linha na tabela de decisões do `ARCHITECTURE.md`.
   Decisão de adiar algo para V2 → mesma tabela, com justificativa.

## Convenções de código

### Estrutura de pastas (padrão já estabelecido, manter)

```
server/
  auth/           — sessão e autorização (tenant e staff, sempre separados)
  services/       — regra de negócio reaproveitável
  integrations/   — comunicação técnica com terceiros (Meta, Typebot, Make)
components/
  <domínio>/      — componentes React específicos de um domínio
app/
  (tenant)/       — tudo que carrega SessionProvider do tenant
  staff/          — painel interno, sem SessionProvider do tenant
  api/
    admin/        — só sessão de staff (requireApiStaff)
    <demais>/     — só sessão de tenant (requireApiUser) ou webhook público
```

### DTO explícito, sempre

Toda resposta de API voltada ao tenant declara os campos retornados —
nunca `return NextResponse.json(registroCru)`. Isso é o que impede um
`include` adicionado no futuro de vazar campo técnico sem ninguém notar.

### Checagem de sessão

- Server Component / Page do tenant → `requireTenantUser()`
- API Route do tenant → `requireApiUser()`
- Server Component / Page de staff → `requireStaffUser()`
- API Route de staff → `requireApiStaff()`

Nunca misturar os quatro. Nunca checar `role`/`staffRole` por comparação
direta em rota nova — resolver via `hasPermission`/catálogo quando a
lógica existir; até lá, comentar explicitamente que é uma simplificação
temporária da V1.

### Auditoria

Toda ação de staff que lê ou altera dado de um tenant específico chama
`logAudit(...)` (ver `server/services/audit/logAudit.ts`). Não é opcional
nem "para depois" — é parte da própria implementação da rota.

### Nomenclatura

- Enums e chaves de catálogo em `UPPER_SNAKE_CASE`.
- Rota de API em `kebab-case`, alinhada ao nome do recurso REST.
- Nunca abreviar termo técnico de um jeito que pareça termo comercial
  (e o inverso) — a ambiguidade de nome é o tipo de erro que causa
  vazamento de informação entre as duas camadas.

## Definição de pronto (por sprint)

Uma sprint só é considerada concluída quando:

- [ ] Código compila (`tsc`/`next build` mentalmente verificado — sem
      import quebrado, sem tipo incompatível)
- [ ] Nenhuma rota nova de tenant expõe campo técnico
- [ ] Nenhuma rota nova de staff é acessível sem `requireApiStaff`
- [ ] `ARCHITECTURE.md` atualizado se houve decisão estrutural nova
- [ ] Relatório de sprint entregue conforme o formato combinado

## Formato do relatório de sprint

Todo sprint fecha com: resumo do que foi implementado · arquivos
criados/alterados · decisões arquiteturais tomadas · justificativas
técnicas · riscos · checklist de validação · próximos passos
recomendados.

## Gatilhos de interrupção (quando parar e perguntar)

Só interromper o fluxo autônomo quando a decisão envolver: arquitetura
principal da plataforma, modelo de dados, regra de negócio, experiência
do usuário, modelo comercial, segurança da plataforma, ou qualquer
mudança com risco real de retrabalho significativo depois. Fora isso,
implementar e reportar no fechamento da sprint.
