// app/api/leads/[leadId]/route.ts  (SUBSTITUI o GET; PATCH ganha a mesma checagem)

import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma/client";
import { requireApiUser } from "@/server/auth/apiAuth";
import { canAccessLead } from "@/server/services/access/resolveLeadScope";
import { LeadStatusKey } from "@prisma/client";

export async function GET(req: Request, { params }: { params: { leadId: string } }) {
  const { user, response } = await requireApiUser();
  if (!user) return response;

  const lead = await prisma.lead.findUnique({
    where: { id: params.leadId },
    include: {
      assignedToUser: { select: { id: true, name: true, role: true } },
      businessChannel: { select: { type: true, displayLabel: true } },
      campaign: { select: { name: true } },
      movements: { orderBy: { createdAt: "desc" }, take: 100 },
      actions: { orderBy: { createdAt: "desc" }, take: 100 },
      tasks: { orderBy: { dueAt: "asc" }, take: 100 },
      attachments: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });

  // 404 (não 403) tanto para "não existe" quanto para "existe mas fora do
  // escopo" — não revelar a um corretor que um lead de outro colega existe
  if (!lead || !(await canAccessLead(user, lead))) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  return NextResponse.json(lead);
}

export async function PATCH(req: Request, { params }: { params: { leadId: string } }) {
  const { user, response } = await requireApiUser();
  if (!user) return response;

  const lead = await prisma.lead.findUnique({ where: { id: params.leadId } });
  if (!lead || !(await canAccessLead(user, lead))) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const statusKey = body.statusKey as LeadStatusKey | undefined;
  const assignedToUserId = body.assignedToUserId as string | null | undefined;
  const note = (body.note as string | undefined) ?? "Atualização do lead";

  const updated = await prisma.lead.update({
    where: { id: params.leadId },
    data: {
      ...(statusKey ? { statusKey } : {}),
      ...(assignedToUserId !== undefined ? { assignedToUserId: assignedToUserId ?? null } : {}),
      ...(statusKey
        ? {
            movements: {
              create: {
                tenantId: user.tenantId,
                fromStatus: lead.statusKey,
                toStatus: statusKey,
                changedByUserId: user.id,
                note,
              },
            },
          }
        : {}),
    },
    include: { assignedToUser: true, businessChannel: true },
  });

  return NextResponse.json(updated);
}
