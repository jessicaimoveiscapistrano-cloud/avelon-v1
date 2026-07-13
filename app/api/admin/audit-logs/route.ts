// app/api/admin/audit-logs/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma/client";
import { requireApiStaff } from "@/server/auth/staffSession";

export async function GET(req: Request) {
  const { staff, response } = await requireApiStaff();
  if (!staff) return response;

  const url = new URL(req.url);
  const tenantId = url.searchParams.get("tenantId");
  const take = Math.min(Number(url.searchParams.get("take") ?? 50), 200);

  const logs = await prisma.auditLog.findMany({
    where: tenantId ? { tenantId } : undefined,
    orderBy: { createdAt: "desc" },
    take,
    include: {
      staff: { select: { name: true } },
      tenant: { select: { name: true } },
    },
  });

  return NextResponse.json(logs);
}
