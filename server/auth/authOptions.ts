// server/auth/authOptions.ts  (ARQUIVO COMPLETO — substitui o existente)
//
// Único ponto de mudança em relação à versão original: workspaceId
// passa a ser carregado no authorize(), no jwt() e no session(). Sem
// isso, toda criação de Lead falha (Lead.workspaceId é obrigatório
// desde a Fase 0/1, mas a sessão nunca foi atualizada até agora).

import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/server/prisma/client";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.passwordHash) return null;

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          tenantId: user.tenantId,
          workspaceId: user.workspaceId, // ✅ adicionado
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.tenantId = (user as any).tenantId;
        token.workspaceId = (user as any).workspaceId; // ✅ adicionado
        token.role = (user as any).role;
        token.id = (user as any).id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).tenantId = token.tenantId;
        (session.user as any).workspaceId = token.workspaceId; // ✅ adicionado
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
};
