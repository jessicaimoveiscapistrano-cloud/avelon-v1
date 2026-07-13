// app/api/leads/kanban/route.ts  (SUBSTITUI o GET existente)

import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma/client";
import { requireApiUser } from "@/server/auth/apiAuth";
import { resolveLeadScopeFilter } from "@/server/services/access/resolveLeadScope";
import { LeadStatusKey } from "@prisma/client";

const KANBAN_ORDER: LeadStatusKey[] = [
  "NEW", "FIRST_CONTACT", "IN_PROGRESS", "SCHEDULED_VISIT", "VISITED",
  "PROPOSAL", "NEGOTIATION", "CONTRACT", "WON", "LOST",
];

export async function GET(req: Request) {
  const { user, response } = await requireApiUser();
  if (!user) return response;

  const scope = await resolveLeadScopeFilter(user);

  const url = new URL(req.url);
  const city = url.searchParams.get("city")?.trim();

  const where: any = { ...scope, ...(city ? { city: { equals: city, mode: "insensitive" } } : {}) };

  const leads = await prisma.lead.findMany({
    where,
    orderBy: { enteredAt: "desc" },
    include: {
      assignedToUser: { select: { id: true, name: true } },
      businessChannel: { select: { type: true, displayLabel: true } },
    },
  });

  const columns = KANBAN_ORDER.map((statusKey) => {
    const items = leads.filter((l) => l.statusKey === statusKey);
    return { statusKey, count: items.length, leads: items };
  });

  return NextResponse.json({ columns });
}
