// app/api/integrations/status/route.ts
//
// Substitui o propósito das antigas telas de configuração técnica do
// lado tenant. Retorna só o que o cliente pode ver: canal comercial e se
// está conectado — nunca technicalSource, token, ou qualquer detalhe de
// implementação.

import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma/client";
import { requireApiUser } from "@/server/auth/apiAuth";

export async function GET() {
  const { user, response } = await requireApiUser();
  if (!user) return response;

  const channels = await prisma.businessChannel.findMany({
    where: { tenantId: user.tenantId },
    select: {
      type: true,
      displayLabel: true,
      technicalSources: { select: { id: true } }, // só para inferir conectado/não, não serializado
    },
  });

  // DTO estritamente comercial — nenhum id/label técnico sai daqui
  const status = channels.map((c) => ({
    canal: c.type,
    label: c.displayLabel,
    conectado: c.technicalSources.length > 0,
  }));

  return NextResponse.json({ integracoes: status });
}
