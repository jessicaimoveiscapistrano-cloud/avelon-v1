// app/api/leads/[leadId]/distribution/auto/route.ts  (SUBSTITUI o POST existente)

import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma/client";
import { requireApiUser } from "@/server/auth/apiAuth";
import { canAccessLead } from "@/server/services/access/resolveLeadScope";
import { hasPermission } from "@/server/services/access/permissions";
import { assignLeadByRules } from "@/server/services/leads/distribution";

export async function POST(req: Request, { params }: { params: { leadId: string } }) {
  const { user, response } = await requireApiUser();
  if (!user) return response;

  // ✅ mesmo gate da distribuição manual — CORRECTOR não redistribui
  if (!(await hasPermission(user.role, "leads.distribute"))) {
    return NextResponse.json({ message: "Sem permissão para redistribuir leads" }, { status: 403 });
  }

  const lead = await prisma.lead.findUnique({ where: { id: params.leadId } });
  if (!lead || !(await canAccessLead(user, lead))) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const businessChannel = lead.businessChannelId
    ? await prisma.businessChannel.findUnique({ where: { id: lead.businessChannelId } })
    : null;

  const assignedToUserId = await assignLeadByRules({
    tenantId: user.tenantId,
    city: lead.city,
    neighborhood: lead.neighborhood ?? undefined,
    propertyPurpose: lead.propertyPurpose,
    propertyType: lead.propertyType ?? undefined,
    businessChannelId: businessChannel?.id,
  });

  const updated = await prisma.lead.update({
    where: { id: params.leadId },
    data: {
      assignedToUserId: assignedToUserId ?? undefined,
      movements: {
        create: {
          tenantId: user.tenantId,
          changedByUserId: user.id,
          note: "Distribuição automática (regras aplicadas)",
        },
      },
    },
    include: { assignedToUser: true },
  });

  return NextResponse.json(updated);
}
