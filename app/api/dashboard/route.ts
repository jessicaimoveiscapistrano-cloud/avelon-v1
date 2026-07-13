// app/api/dashboard/route.ts  (SUBSTITUI o patch da Sprint 2 — fecha o TODO)
//
// A Sprint 2 aplicou o escopo por papel via patch e deixou uma nota
// pedindo para trocar `leadSourceKey`/`leadSource` por `businessChannel`
// quando a migração da Fase 0/1 fosse aplicada — isso já aconteceu desde
// a própria Fase 0/1, então a nota era dívida represada. Fechada agora:
// filtro por origem passa a ser por `channelType` (BusinessChannelType).

import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma/client";
import { requireApiUser } from "@/server/auth/apiAuth";
import { resolveLeadScopeFilter } from "@/server/services/access/resolveLeadScope";
import { LeadStatusKey } from "@prisma/client";

export async function GET(req: Request) {
  const { user, response } = await requireApiUser();
  if (!user) return response;

  const scope = await resolveLeadScopeFilter(user);

  const url = new URL(req.url);
  const fromDate = url.searchParams.get("fromDate");
  const toDate = url.searchParams.get("toDate");
  const city = url.searchParams.get("city")?.trim();
  const assignedToUserId = url.searchParams.get("assignedToUserId");
  const channelType = url.searchParams.get("channelType"); // ✅ era leadSourceKey

  const dateFilter =
    fromDate || toDate
      ? {
          enteredAt: {
            ...(fromDate ? { gte: new Date(fromDate) } : {}),
            ...(toDate ? { lte: new Date(toDate) } : {}),
          },
        }
      : {};

  const baseWhere: any = {
    ...scope,
    ...dateFilter,
    ...(city ? { city: { equals: city, mode: "insensitive" } } : {}),
    ...(assignedToUserId ? { assignedToUserId } : {}),
    ...(channelType ? { businessChannel: { type: channelType } } : {}), // ✅ era leadSource: { key: leadSourceKey }
  };

  const grouped = await prisma.lead.groupBy({
    by: ["statusKey"],
    where: baseWhere,
    _count: { _all: true },
  });

  const byStatus: Record<string, number> = {};
  for (const key of Object.values(LeadStatusKey)) byStatus[key] = 0;
  for (const g of grouped) byStatus[g.statusKey] = g._count._all;

  const total = grouped.reduce((acc, g) => acc + g._count._all, 0);

  const wonAgg = await prisma.lead.aggregate({
    where: { ...baseWhere, statusKey: "WON" },
    _count: { _all: true },
    _sum: { desiredValue: true },
  });

  const wonCount = wonAgg._count._all;
  const wonValue = wonAgg._sum.desiredValue ? Number(wonAgg._sum.desiredValue) : 0;
  const lostCount = byStatus["LOST"] ?? 0;
  const conversionRate = total > 0 ? wonCount / total : 0;

  const wonLeads = await prisma.lead.findMany({
    where: { ...baseWhere, statusKey: "WON" },
    select: {
      id: true,
      enteredAt: true,
      movements: {
        where: { toStatus: "WON" },
        orderBy: { createdAt: "asc" },
        take: 1,
        select: { createdAt: true },
      },
    },
  });

  let avgTimeToWonDays: number | null = null;
  if (wonLeads.length > 0) {
    const diffs: number[] = [];
    for (const lead of wonLeads) {
      const wonAt = lead.movements[0]?.createdAt;
      if (wonAt) {
        diffs.push((wonAt.getTime() - lead.enteredAt.getTime()) / (1000 * 60 * 60 * 24));
      }
    }
    if (diffs.length > 0) {
      avgTimeToWonDays = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    }
  }

  // ✅ agrupamento por origem agora é por BusinessChannel (comercial),
  // nunca por TechnicalSource — consistente com a separação Platform/CRM
  const channels = await prisma.businessChannel.findMany({
    where: { tenantId: user.tenantId },
    select: { type: true, displayLabel: true },
  });

  const bySource = await Promise.all(
    channels.map(async (channel) => {
      const channelWhere = { ...baseWhere, businessChannel: { type: channel.type } };
      const [channelTotal, channelWon, channelWonValueAgg] = await Promise.all([
        prisma.lead.count({ where: channelWhere }),
        prisma.lead.count({ where: { ...channelWhere, statusKey: "WON" } }),
        prisma.lead.aggregate({
          where: { ...channelWhere, statusKey: "WON" },
          _sum: { desiredValue: true },
        }),
      ]);
      return {
        channelType: channel.type,
        channelLabel: channel.displayLabel,
        total: channelTotal,
        won: channelWon,
        wonValue: channelWonValueAgg._sum.desiredValue ? Number(channelWonValueAgg._sum.desiredValue) : 0,
        conversionRate: channelTotal > 0 ? channelWon / channelTotal : 0,
      };
    })
  );

  return NextResponse.json({
    total,
    byStatus,
    won: { count: wonCount, totalValue: wonValue },
    lost: { count: lostCount },
    conversionRate,
    avgTimeToWonDays,
    bySource,
  });
}
