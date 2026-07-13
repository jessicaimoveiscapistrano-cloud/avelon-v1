// server/services/access/resolveLeadScope.ts
//
// Ponto único de resolução de escopo. Toda rota que lê Lead, LeadTask ou
// dado agregado de lead usa esta função para construir o filtro — nunca
// reimplementa a lógica de "o que este papel pode ver" localmente.
//
// IMPORTANTE: isto é filtro de LEITURA. A permissão de AÇÃO (ex:
// redistribuir para qualquer corretor do tenant) é resolvida separadamente
// via hasPermission — ver ARCHITECTURE.md §16/§17 para a justificativa de
// por que a Fase 5 deliberadamente separa as duas coisas.

import type { Prisma, UserRole } from "@prisma/client";
import { getManagedUserIds } from "./resolveTeam";

type ScopeUser = {
  id: string;
  tenantId: string;
  role: UserRole;
};

export async function resolveLeadScopeFilter(user: ScopeUser): Promise<Prisma.LeadWhereInput> {
  const base: Prisma.LeadWhereInput = { tenantId: user.tenantId };

  if (user.role === "OWNER") {
    return base;
  }

  if (user.role === "MANAGER") {
    const teamIds = await getManagedUserIds(user.id);
    return {
      ...base,
      OR: [{ assignedToUserId: { in: teamIds } }, { assignedToUserId: null }],
    };
  }

  // CORRECTOR
  return { ...base, assignedToUserId: user.id };
}

// Checagem de acesso a UM lead específico (rota de detalhe) — evita ter
// que duplicar a lógica acima como "está dentro da lista teria retornado".
export async function canAccessLead(
  user: ScopeUser,
  lead: { tenantId: string; assignedToUserId: string | null }
): Promise<boolean> {
  if (lead.tenantId !== user.tenantId) return false;
  if (user.role === "OWNER") return true;

  if (user.role === "MANAGER") {
    if (lead.assignedToUserId === null) return true;
    const teamIds = await getManagedUserIds(user.id);
    return teamIds.includes(lead.assignedToUserId);
  }

  // CORRECTOR
  return lead.assignedToUserId === user.id;
}
