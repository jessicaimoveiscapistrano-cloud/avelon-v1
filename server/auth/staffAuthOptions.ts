// server/auth/staffAuthOptions.ts
//
// Autenticação da Avelon Platform (equipe interna). Deliberadamente
// separada de server/auth/authOptions.ts (autenticação do tenant):
// - tabela própria (AvelonStaff, sem tenantId)
// - cookie de sessão com nome próprio (ver `cookies` abaixo)
// - JWT que carrega { staffId, staffRole } — nunca tenantId
//
// Fase 2 — preparado, ainda não ativado em nenhuma rota real.

import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/server/prisma/client";

export const staffAuthOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/staff/login" },

  // secret próprio — isolamento de defesa em profundidade: comprometer o
  // secret de um domínio de identidade não compromete o outro
  secret: process.env.STAFF_NEXTAUTH_SECRET,

  // IMPORTANTE: o NextAuth usa, por padrão, os nomes "next-auth.session-token",
  // "next-auth.csrf-token" e "next-auth.callback-url" para TODOS os cookies
  // que ele gerencia — não apenas o de sessão. Como o lado tenant
  // (server/auth/authOptions.ts) não sobrescreve esses nomes, os TRÊS
  // precisam ser sobrescritos aqui, não só o sessionToken, senão os dois
  // logins colidiriam no mesmo cookie de CSRF/callback no mesmo navegador.
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-avelon-staff-session-token"
          : "avelon-staff-session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    csrfToken: {
      name: "avelon-staff-csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    callbackUrl: {
      name: "avelon-staff-callback-url",
      options: {
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },

  providers: [
    CredentialsProvider({
      id: "avelon-staff-credentials",
      name: "Avelon Staff",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const staff = await prisma.avelonStaff.findUnique({
          where: { email: credentials.email },
        });

        if (!staff) return null;

        const valid = await bcrypt.compare(credentials.password, staff.passwordHash);
        if (!valid) return null;

        // formato deliberadamente sem tenantId — ver types/next-auth-staff.d.ts
        return {
          id: staff.id,
          name: staff.name,
          email: staff.email,
          staffRole: staff.role,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.staffId = (user as any).id;
        token.staffRole = (user as any).staffRole;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).staffId = token.staffId;
        (session.user as any).staffRole = token.staffRole;
        // nunca atribuir tenantId aqui — sessão de staff não tem tenant
      }
      return session;
    },
  },
};
