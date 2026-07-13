# Avelon V1 — Como colocar no ar (grátis, sem instalar nada)

Siga exatamente nesta ordem. Cada etapa é feita pelo navegador.

---

## Passo 1 — GitHub (guardar o código)

1. Acesse **github.com** e crie uma conta (com seu e-mail pessoal).
2. Clique em **"New repository"**. Nome: `avelon-v1`. Deixe **Private**. Crie.
3. Na página do repositório vazio, clique em **"uploading an existing file"**.
4. Abra a pasta deste projeto no seu computador (extraia o zip primeiro) e
   **arraste TODOS os arquivos e pastas** pra dentro da área de upload do
   GitHub.
5. Role até o final, clique **"Commit changes"**.

> Não precisa saber usar `git`. O upload pelo navegador funciona igual.

---

## Passo 2 — Neon (banco de dados PostgreSQL grátis)

1. Acesse **neon.tech** e crie uma conta.
2. Clique **"Create a project"**. Nome: `avelon`. Região: a mais próxima
   do Brasil disponível.
3. Depois de criado, vá em **"Connection Details"** e copie a string que
   começa com `postgresql://...` — isso é o seu `DATABASE_URL`.
4. Guarde essa string, você vai usar no Passo 3.

---

## Passo 3 — Vercel (publicar o site)

1. Acesse **vercel.com** e crie uma conta **"Continue with GitHub"** (usa
   a mesma conta do Passo 1 — mais simples).
2. Clique **"Add New" → "Project"**.
3. Selecione o repositório `avelon-v1` que você criou. Clique **"Import"**.
4. Antes de clicar em Deploy, abra **"Environment Variables"** e adicione,
   uma por uma:

   | Nome | Valor |
   |---|---|
   | `DATABASE_URL` | a string que você copiou do Neon |
   | `NEXTAUTH_URL` | deixe em branco por enquanto (volta aqui depois) |
   | `NEXTAUTH_SECRET` | qualquer texto longo e aleatório, ex: `avelon-secret-2026-xyz123abc` |
   | `STAFF_NEXTAUTH_SECRET` | outro texto longo, **diferente** do de cima |
   | `META_APP_SECRET` | pode deixar `pendente` por enquanto |
   | `META_VERIFY_TOKEN` | pode deixar `pendente` por enquanto |

5. Clique **"Deploy"**. Espere terminar (2-4 minutos).
6. Quando terminar, a Vercel te dá um link tipo `avelon-v1.vercel.app`.
   **Copie esse link.**
7. Volte em **Settings → Environment Variables**, edite `NEXTAUTH_URL` e
   coloque esse link completo, com `https://` na frente
   (ex: `https://avelon-v1.vercel.app`).
8. Vá em **Deployments**, clique nos "..." do último deploy → **"Redeploy"**
   (pra aplicar a variável nova).

---

## Passo 4 — Criar as tabelas no banco e o usuário inicial

Isso precisa rodar **uma vez**, ligado ao banco do Neon. Não dá pra fazer
só pelo navegador da Vercel — mas você também não precisa instalar nada
permanente: dá pra usar o **Neon SQL Editor** de um jeito indireto, rodando
o Prisma através de um terminal temporário gratuito, como o
**Vercel CLI via navegador (Vercel → Project → "..." → "Open Terminal"
não existe no plano free)** — a forma mais simples sem instalar nada é:

**Opção recomendada: GitHub Codespaces (terminal na nuvem, grátis)**
1. No seu repositório no GitHub, clique **"Code" → "Codespaces" → "Create codespace on main"**.
2. Isso abre um VS Code inteiro rodando no navegador, com terminal.
3. No terminal que abrir, cole:
   ```
   npm install
   ```
4. Crie um arquivo `.env` (New File, nome `.env`) com o mesmo conteúdo
   das variáveis que você colocou na Vercel (Passo 3).
5. Rode:
   ```
   npx prisma migrate deploy
   npx prisma db seed
   ```
6. Quando terminar, feche o Codespace (ele é gratuito até um limite de
   horas por mês, mais que suficiente pra isso).

Isso cria as tabelas no Neon e já deixa os usuários de teste prontos
(`admin@avelon.com` / `admin123`, `staff@avelon.com` / `avelon123`, etc.)

---

## Passo 5 — Testar

Acesse `https://SEU-LINK.vercel.app/login` e `https://SEU-LINK.vercel.app/staff/login`
com as credenciais acima.

---

## O que ainda falta (avisar antes de usar de verdade)

- `META_APP_SECRET`/`META_VERIFY_TOKEN` reais só são necessários quando
  for conectar Facebook/WhatsApp de verdade — pode deixar "pendente" até lá.
- Isso é a V1 tecnicamente montada; ainda precisa passar pelo checklist
  de validação funcional (`RUNBOOK-VALIDACAO-V1.md`) antes de considerar
  pronta pra uso real com clientes.
