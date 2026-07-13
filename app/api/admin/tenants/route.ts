// app/api/admin/tenants/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma/client";
import { requireApiStaff } from "@/server/auth/staffSession";

export async function GET() {
  const { staff, response } = await requireApiStaff();
  if (!staff) return response;

  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      createdAt: true,
      organization: { select: { name: true } },
      subscription: { select: { status: true, plan: { select: { name: true } } } },
      _count: { select: { users: true, leads: true } },
    },
  });

  return NextResponse.json(tenants);
}
