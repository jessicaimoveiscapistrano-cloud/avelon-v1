// app/api/leads/[leadId]/tasks/route.ts  (SUBSTITUI GET e POST existentes)

import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma/client";
import { requireApiUser } from "@/server/auth/apiAuth";
import { canAccessLead } from "@/server/services/access/resolveLeadScope";

export async function GET(req: Request, { params }: { params: { leadId: string } }) {
  const { user, response } = await requireApiUser();
  if (!user) return response;

  const lead = await prisma.lead.findUnique({ where: { id: params.leadId } });
  if (!lead || !(await canAccessLead(user, lead))) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const tasks = await prisma.leadTask.findMany({
    where: { tenantId: user.tenantId, leadId: params.leadId },
    orderBy: { dueAt: "asc" },
  });

  return NextResponse.json(tasks);
}

export async function POST(req: Request, { params }: { params: { leadId: string } }) {
  const { user, response } = await requireApiUser();
  if (!user) return response;

  const lead = await prisma.lead.findUnique({ where: { id: params.leadId } });
  if (!lead || !(await canAccessLead(user, lead))) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const body = await req.json();

  const task = await prisma.leadTask.create({
    data: {
      tenantId: user.tenantId,
      leadId: params.leadId,
      title: String(body.title),
      dueAt: new Date(body.dueAt),
      assignedToUserId: body.assignedToUserId ?? null,
    },
  });

  if (task.assignedToUserId) {
    await prisma.notification.create({
      data: {
        tenantId: user.tenantId,
        userId: task.assignedToUserId,
        type: "CUSTOM",
        title: "Nova tarefa atribuída",
        message: `Tarefa: "${task.title}" • Lead: ${lead.name}`,
      },
    });
  }

  return NextResponse.json(task, { status: 201 });
}
