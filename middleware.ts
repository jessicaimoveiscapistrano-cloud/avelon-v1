// middleware.ts (raiz do projeto)
//
// Fronteira de autenticação do lado Avelon Staff. Escopo desta Fase 2:
// proteger /staff/** e /api/admin/** exigindo sessão de staff válida.
//
// Deliberadamente NÃO usa o helper `withAuth` do NextAuth, porque esse
// helper assume um único secret global para decodificar o token — e agora
// temos dois domínios de identidade com secrets DIFERENTES (NEXTAUTH_SECRET
// para o tenant, STAFF_NEXTAUTH_SECRET para o staff). Usar `getToken`
// diretamente permite escolher o secret e o nome do cookie corretos
// conforme o prefixo da rota.
//
// O lado tenant continua protegido exatamente como antes (requireTenantUser
// para páginas, requireApiUser para API routes, verificado dentro de cada
// rota) — este middleware não adiciona nem remove nada do lado tenant.
// Isso é proposital: escopo de dado por papel dentro do tenant é
// responsabilidade da Fase 5, não desta fase.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const STAFF_PREFIXES = ["/staff", "/api/admin"];

const STAFF_COOKIE_NAME =
  process.env.NODE_ENV === "production"
    ? "__Secure-avelon-staff-session-token"
    : "avelon-staff-session-token";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // a própria página de login do staff nunca pode exigir sessão de staff,
  // senão o redirect para /staff/login redirecionaria para si mesmo
  if (pathname === "/staff/login") {
    return NextResponse.next();
  }

  const isStaffRoute = STAFF_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isStaffRoute) {
    return NextResponse.next();
  }

  const staffToken = await getToken({
    req,
    secret: process.env.STAFF_NEXTAUTH_SECRET,
    cookieName: STAFF_COOKIE_NAME,
  });

  if (!staffToken?.staffId) {
    if (pathname.startsWith("/api/admin")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/staff/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  // Fase 2: aplicado apenas aos prefixos reservados de staff.
  // Rotas comerciais continuam fora do matcher deste middleware.
  matcher: ["/staff/:path*", "/api/admin/:path*"],
};
