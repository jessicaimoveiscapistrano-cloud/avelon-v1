// server/services/access/resolveTeam.ts

import { prisma } from "@/server/prisma/client";

// Retorna o próprio id do manager + ids de todos os User cujo managerId
// aponte para ele (equipe direta — V1 não modela hierarquia multi-nível).
export async function getManagedUserIds(managerId: string): Promise<string[]> {
  const directReports = await prisma.user.findMany({
    where: { managerId },
    select: { id: true },
  });

  return [managerId, ...directReports.map((u) => u.id)];
}
