// server/services/audit/logAudit.ts
//
// Ponto único de gravação de AuditLog. Nenhuma rota de /api/admin/** deve
// gravar em AuditLog diretamente via prisma — sempre por aqui, para manter
// o formato de `action` e `metadata` consistente e para que uma auditoria
// futura (Fase 7) tenha um único lugar para inspecionar/testar.

import { prisma } from "@/server/prisma/client";

type LogAuditInput = {
  staffId: string;
  tenantId?: string;
  action: string; // convenção: "<escopo>.<recurso>.<verbo>", ex: "tenant.integration.facebook.updated"
  metadata?: Record<string, unknown>;
};

export async function logAudit(input: LogAuditInput) {
  await prisma.auditLog.create({
    data: {
      actorType: "AVELON_STAFF",
      staffId: input.staffId,
      tenantId: input.tenantId,
      action: input.action,
      metadata: input.metadata as any,
    },
  });
}
