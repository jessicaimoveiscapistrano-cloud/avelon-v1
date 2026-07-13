// app/api/leads/[leadId]/tasks/[taskId]/route.ts  (SUBSTITUI o PATCH existente)

import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma/client";
import { requireApiUser } from "@/server/auth/apiAuth";
import { canAccessLead } from "@/server/services/access/resolveLeadScope";

export async function PATCH(
  req: Request,
  { params }: { params: { leadId: string; taskId: string } }
) {
  const { user, response } = await requireApiUser();
  if (!user) return response;

  const task = await prisma.leadTask.findUnique({ where: { id: params.taskId } });
  if (!task || task.tenantId !== user.tenantId || task.leadId !== params.leadId) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  // ✅ escopo aplicado através do lead pai da tarefa — mesma regra de
  // "corretor só vê/altera o que é dele" vale para tarefas
  const lead = await prisma.lead.findUnique({ where: { id: params.leadId } });
  if (!lead || !(await canAccessLead(user, lead))) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const updated = await prisma.leadTask.update({
    where: { id: params.taskId },
    data: {
      completedAt: new Date(),
      completedByUserId: user.id,
    },
  });

  return NextResponse.json(updated);
}
