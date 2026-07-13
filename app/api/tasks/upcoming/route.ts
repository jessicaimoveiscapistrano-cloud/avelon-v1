// app/api/tasks/upcoming/route.ts  (SUBSTITUI o GET existente)

import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma/client";
import { requireApiUser } from "@/server/auth/apiAuth";
import { resolveLeadScopeFilter } from "@/server/services/access/resolveLeadScope";

export async function GET() {
  const { user, response } = await requireApiUser();
  if (!user) return response;

  const scope = await resolveLeadScopeFilter(user);

  const tasks = await prisma.leadTask.findMany({
    where: {
      tenantId: user.tenantId,
      completedAt: null,
      lead: scope, // ✅ mesma regra de escopo, via relação com o lead
    },
    orderBy: { dueAt: "asc" },
    take: 10,
    include: { lead: { select: { name: true } } },
  });

  return NextResponse.json(tasks);
}
