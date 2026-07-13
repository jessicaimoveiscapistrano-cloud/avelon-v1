// types/next-auth-staff.d.ts
//
// Augmentação de tipos para a sessão de staff. Mantido em arquivo
// separado de types/next-auth.d.ts (sessão de tenant) para deixar
// explícito, já no nível de tipo, que são dois shapes de sessão
// diferentes e não intercambiáveis.

import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      staffId?: string;
      staffRole?: "SUPER_ADMIN" | "SUPPORT" | "ENGINEER" | "FINANCE";
      // campos abaixo pertencem à sessão de tenant (types/next-auth.d.ts);
      // convivem no mesmo tipo Session por limitação do NextAuth em ter
      // dois providers de sessão distintos, mas nunca ambos preenchidos
      // ao mesmo tempo — ver server/auth/staffSession.ts e
      // server/auth/session.ts para a leitura correta de cada um.
      id?: string;
      tenantId?: string;
      workspaceId?: string;
      role?: "OWNER" | "MANAGER" | "CORRECTOR";
      name?: string | null;
      email?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    staffId?: string;
    staffRole?: "SUPER_ADMIN" | "SUPPORT" | "ENGINEER" | "FINANCE";
    id?: string;
    tenantId?: string;
    workspaceId?: string;
    role?: "OWNER" | "MANAGER" | "CORRECTOR";
  }
}
