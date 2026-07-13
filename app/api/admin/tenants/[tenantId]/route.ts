// app/api/admin/tenants/[tenantId]/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma/client";
import { requireApiStaff } from "@/server/auth/staffSession";
import { logAudit } from "@/server/services/audit/logAudit";

export async function GET(req: Request, { params }: { params: { tenantId: string } }) {
  const { staff, response } = await requireApiStaff();
  if (!staff) return response;

  const tenant = await prisma.tenant.findUnique({
    where: { id: params.tenantId },
    select: {
      id: true,
      name: true,
      createdAt: true,
      organization: { select: { id: true, name: true } },
      subscription: { select: { status: true, plan: { select: { key: true, name: true } } } },
      users: { select: { id: true, name: true, email: true, role: true, managerId: true } },
      businessChannels: { select: { type: true, displayLabel: true } },
      technicalSources: {
        select: { id: true, kind: true, label: true, businessChannel: { select: { type: true } } },
      },
      workspaces: { select: { id: true, name: true, isDefault: true } },
    },
  });

  if (!tenant) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const [facebookConfig, whatsappConfig] = await Promise.all([
    prisma.facebookPageConfig.findMany({
      where: { tenantId: params.tenantId },
      select: { id: true, pageId: true, pageName: true, enabled: true },
    }),
    prisma.whatsAppConfig.findUnique({
      where: { tenantId: params.tenantId },
      select: { id: true, phoneNumberId: true, displayPhoneNumber: true, enabled: true },
    }),
  ]);

  await logAudit({ staffId: staff.id, tenantId: params.tenantId, action: "tenant.viewed" });

  return NextResponse.json({ ...tenant, facebookConfig, whatsappConfig });
}
