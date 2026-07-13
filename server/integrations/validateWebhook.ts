// server/integrations/validateWebhook.ts  (CORRIGE arquivo com resíduo pré-Fase 0/1)
//
// BUG ENCONTRADO NA VARREDURA DA SPRINT 3: esta função ainda fazia
// `include: { source: true }` e comparava `source: { key: sourceKey }` —
// a relação `source` e o campo `key` não existem mais desde que
// IntegrationSource virou TechnicalSource (relação `technicalSource`,
// campo `kind`). Toda chamada de webhook do Typebot/Make estava
// quebrada — o Prisma teria lançado erro de campo desconhecido.

import { prisma } from "@/server/prisma/client";

export async function validateWebhookSecret(req: Request, sourceKey: string) {
  const secret = req.headers.get("x-webhook-secret");
  if (!secret) return null;

  const webhook = await prisma.integrationWebhook.findFirst({
    where: {
      enabled: true,
      secret,
      technicalSource: { kind: sourceKey }, // ✅ era: source: { key: sourceKey }
    },
    include: { technicalSource: true }, // ✅ era: include: { source: true }
  });

  return webhook; // null se inválido
}
