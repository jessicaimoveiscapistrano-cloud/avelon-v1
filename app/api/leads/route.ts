// app/api/leads/route.ts  (SUBSTITUI o GET existente; POST inalterado)
//
// Único ponto de mudança real: o `where` da listagem passa a incluir o
// filtro de escopo resolvido centralmente, em vez de só `{ tenantId }`.

import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma/client";
import { requireApiUser } from "@/server/auth/apiAuth";
import { resolveLeadScopeFilter } from "@/server/services/access/resolveLeadScope";

export async function GET(req: Request) {
  const { user, response } = await requireApiUser();
  if (!user) return response;

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();
  const status = url.searchParams.get("status");
  const assignedToUserId = url.searchParams.get("assignedToUserId");
  const city = url.searchParams.get("city")?.trim();
  const propertyPurpose = url.searchParams.get("propertyPurpose");
  const fromDate = url.searchParams.get("fromDate");
  const toDate = url.searchParams.get("toDate");
  const take = Math.min(Number(url.searchParams.get("take") ?? 50), 200);

  const scope = await resolveLeadScopeFilter(user);

  const where: any = { ...scope };

  // filtros explícitos do usuário nunca "vazam" escopo — se o corretor
  // tentar filtrar por assignedToUserId de outra pessoa, o AND com o
  // scope acima simplesmente não retorna nada (não é um bypass)
  if (status) where.statusKey = status;
  if (assignedToUserId) where.assignedToUserId = assignedToUserId;
  if (city) where.city = { equals: city, mode: "insensitive" };
  if (propertyPurpose) where.propertyPurpose = propertyPurpose;
  if (fromDate || toDate) {
    where.enteredAt = {
      ...(fromDate ? { gte: new Date(fromDate) } : {}),
      ...(toDate ? { lte: new Date(toDate) } : {}),
    };
  }
  if (q) {
    where.AND = [
      ...(where.AND ?? []),
      {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { phone: { contains: q } },
          { email: { contains: q, mode: "insensitive" } },
          { city: { contains: q, mode: "insensitive" } },
        ],
      },
    ];
  }

  const leads = await prisma.lead.findMany({
    where,
    orderBy: { enteredAt: "desc" },
    take,
    include: {
      assignedToUser: { select: { id: true, name: true } },
      businessChannel: { select: { type: true, displayLabel: true } },
    },
  });

  return NextResponse.json(leads);
}

export async function POST(req: Request) {
  const { user, response } = await requireApiUser();
  if (!user) return response;

  const body = await req.json();

  const lead = await prisma.lead.create({
    data: {
      tenantId: user.tenantId,
      workspaceId: user.workspaceId,
      name: body.name,
      phone: body.phone,
      email: body.email || null,
      city: body.city,
      neighborhood: body.neighborhood || null,
      propertyPurpose: body.propertyPurpose,
      propertyType: body.propertyType || null,
      desiredValue: body.desiredValue ? Number(body.desiredValue) : null,
      assignedToUserId: body.assignedToUserId || null,
      observations: body.observations || null,
    },
  });

  return NextResponse.json(lead, { status: 201 });
}
