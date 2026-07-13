// app/(tenant)/layout.tsx  (NOVO ARQUIVO)
//
// Único ponto da árvore que carrega o SessionProvider do tenant. Tudo que
// precisa da sessão de tenant (useSession, signIn/signOut de
// "next-auth/react") deve viver dentro deste grupo de rotas.
//
// Route groups do Next.js — os parênteses em "(tenant)" — não aparecem na
// URL. Ou seja, mover app/login/page.tsx para
// app/(tenant)/login/page.tsx NÃO muda a URL: continua sendo /login.
// O mesmo vale para app/(dashboard)/** → app/(tenant)/(dashboard)/**.
//
// Migração necessária (relocação de arquivo, conteúdo inalterado):
//   app/login/page.tsx           → app/(tenant)/login/page.tsx
//   app/(dashboard)/**           → app/(tenant)/(dashboard)/**
//   app/providers.tsx            → app/(tenant)/providers.tsx

import { Providers } from "./providers";

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>;
}
