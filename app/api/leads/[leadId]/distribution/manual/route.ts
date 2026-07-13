// app/api/leads/[leadId]/distribution/manual/route.ts  (SUBSTITUI o POST existente)

import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma/client";
import { requireApiUser } from "@/server/auth/apiAuth";
import { canAccessLead } from "@/server/services/access/resolveLeadScope";
import { hasPermission } from "@/server/services/access/permissions";

export async function POST(req: Request, { params }: { params: { leadId: string } }) {
  const { user, response } = await requireApiUser();
  if (!user) return response;

  // ✅ gate de permissão — CORRECTOR não tem "leads.distribute" (ver seed
  // de RolePermission da Fase 0/1), então recebe 403 aqui. Isto não
  // existia antes da Fase 5: a rota antiga não checava permissão nenhuma
  // além de estar logado.
  if (!(await hasPermission(user.role, "leads.distribute"))) {
    return NextResponse.json({ message: "Sem permissão para redistribuir leads" }, { status: 403 });
  }

  const lead = await prisma.lead.findUnique({ where: { id: params.leadId } });
  if (!lead || !(await canAccessLead(user, lead))) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const assignedToUserId = body.assignedToUserId as string | null;

  // ✅ decisão explícita (Fase 5): Manager redistribui para QUALQUER
  // corretor do tenant, não só da própria equipe — só valida que o alvo
  // pertence ao mesmo tenant, sem restrição adicional de equipe
  if (assignedToUserId) {
    const target = await prisma.user.findUnique({ where: { id: assignedToUserId } });
    if (!target || target.tenantId !== user.tenantId) {
      return NextResponse.json({ message: "Invalid user for tenant" }, { status: 400 });
    }
  }

  const updated = await prisma.lead.update({
    where: { id: params.leadId },
    data: {
      assignedToUserId: assignedToUserId ?? null,
      movements: {
        create: {
          tenantId: user.tenantId,
          changedByUserId: user.id,
          note: "Distribuição manual (atribuição de corretor)",
        },
      },
    },
    include: { assignedToUser: true },
  });

  return NextResponse.json(updated);
}
