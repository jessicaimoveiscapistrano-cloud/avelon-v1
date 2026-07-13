// server/auth/session.ts  (ARQUIVO COMPLETO — substitui o existente)

import { getServerSession } from "next-auth";
import { authOptions } from "./authOptions";

export async function getSessionUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const u = session.user as any;
  return {
    id: u.id as string,
    tenantId: u.tenantId as string,
    workspaceId: u.workspaceId as string, // ✅ adicionado
    role: u.role as "OWNER" | "MANAGER" | "CORRECTOR",
    name: u.name as string,
    email: u.email as string,
  };
}
