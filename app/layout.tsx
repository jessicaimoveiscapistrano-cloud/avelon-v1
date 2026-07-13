// app/layout.tsx  (SUBSTITUI o arquivo atual)
//
// Antes, este layout envolvia TODA a árvore de rotas — incluindo /login e
// /(dashboard) — com <Providers> (SessionProvider do tenant). Como
// app/staff/** é irmão dessas rotas sob app/, herdaria esse mesmo
// SessionProvider só por estar na árvore, mesmo sem usar seus hooks.
//
// Correção: o SessionProvider do tenant migrou para
// app/(tenant)/layout.tsx (novo grupo de rotas). Este layout raiz passa a
// ser estritamente estrutural — nenhum dos dois domínios de identidade
// tem tratamento especial aqui.

import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
