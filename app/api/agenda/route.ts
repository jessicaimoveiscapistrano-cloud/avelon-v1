// app/api/agenda/route.ts  (SUBSTITUI o patch da Sprint 2 — formaliza como arquivo final)

import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma/client";
import { requireApiUser } from "@/server/auth/apiAuth";
import { resolveLeadScopeFilter } from "@/server/services/access/resolveLeadScope";

export async function GET(req: Request) {
  const { user, response } = await requireApiUser();
  if (!user) return response;

  const scope = await resolveLeadScopeFilter(user);

  const url = new URL(req.url);
  const assignedToUserId = url.searchParams.get("assignedToUserId");

  const [tasks, actions] = await Promise.all([
    prisma.leadTask.findMany({
      where: {
        tenantId: user.tenantId,
        lead: scope,
        ...(assignedToUserId ? { assignedToUserId } : {}),
      },
      include: { lead: { select: { name: true, phone: true } } },
      orderBy: { dueAt: "asc" },
    }),
    prisma.leadAction.findMany({
      where: {
        tenantId: user.tenantId,
        lead: scope,
        scheduledAt: { not: null },
      },
      include: { lead: { select: { name: true, phone: true } } },
      orderBy: { scheduledAt: "asc" },
    }),
  ]);

  const items = [
    ...tasks.map((t) => ({
      id: t.id, kind: "TASK" as const, title: t.title,
      date: t.dueAt, done: !!t.completedAt, leadName: t.lead.name, leadPhone: t.lead.phone,
    })),
    ...actions.map((a) => ({
      id: a.id, kind: "ACTION" as const, title: `${a.type} agendada`,
      date: a.scheduledAt!, done: !!a.performedAt, leadName: a.lead.name, leadPhone: a.lead.phone,
    })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return NextResponse.json({ items });
}
