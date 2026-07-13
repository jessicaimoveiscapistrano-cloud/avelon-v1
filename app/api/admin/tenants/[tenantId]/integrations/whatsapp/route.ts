// app/api/admin/tenants/[tenantId]/integrations/whatsapp/route.ts
//
// Substitui o antigo app/api/integrations/whatsapp/config/route.ts
// (DELETAR esse arquivo antigo — expunha accessToken no namespace do
// tenant). Mesmo padrão do endpoint de Facebook: só staff, tenantId
// explícito, auditado.

import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma/client";
import { requireApiStaff } from "@/server/auth/staffSession";
import { logAudit } from "@/server/services/audit/logAudit";

export async function GET(req: Request, { params }: { params: { tenantId: string } }) {
  const { staff, response } = await requireApiStaff();
  if (!staff) return response;

  const config = await prisma.whatsAppConfig.findUnique({
    where: { tenantId: params.tenantId },
    select: {
      id: true,
      phoneNumberId: true,
      displayPhoneNumber: true,
      businessAccountId: true,
      enabled: true,
      createdAt: true,
      // accessToken nunca é retornado, nem para staff, por esta rota
    },
  });

  await logAudit({
    staffId: staff.id,
    tenantId: params.tenantId,
    action: "tenant.integration.whatsapp.viewed",
  });

  return NextResponse.json(config);
}

export async function POST(req: Request, { params }: { params: { tenantId: string } }) {
  const { staff, response } = await requireApiStaff();
  if (!staff) return response;

  const body = await req.json();
  const { phoneNumberId, businessAccountId, displayPhoneNumber, accessToken } = body;

  if (!phoneNumberId || !businessAccountId || !accessToken) {
    return NextResponse.json(
      { message: "phoneNumberId, businessAccountId e accessToken são obrigatórios" },
      { status: 422 }
    );
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: params.tenantId } });
  if (!tenant) {
    return NextResponse.json({ message: "Tenant não encontrado" }, { status: 404 });
  }

  const technicalSource = await prisma.technicalSource.upsert({
    where: { tenantId_kind: { tenantId: params.tenantId, kind: "WHATSAPP" } },
    update: {},
    create: { tenantId: params.tenantId, kind: "WHATSAPP", label: "WhatsApp Cloud API" },
  });

  const businessChannel = await prisma.businessChannel.upsert({
    where: { tenantId_type: { tenantId: params.tenantId, type: "WHATSAPP" } },
    update: {},
    create: { tenantId: params.tenantId, type: "WHATSAPP", displayLabel: "WhatsApp" },
  });

  if (technicalSource.businessChannelId !== businessChannel.id) {
    await prisma.technicalSource.update({
      where: { id: technicalSource.id },
      data: { businessChannelId: businessChannel.id },
    });
  }

  const config = await prisma.whatsAppConfig.upsert({
    where: { tenantId: params.tenantId },
    update: { phoneNumberId, businessAccountId, displayPhoneNumber, accessToken, technicalSourceId: technicalSource.id },
    create: {
      tenantId: params.tenantId,
      technicalSourceId: technicalSource.id,
      phoneNumberId,
      businessAccountId,
      displayPhoneNumber,
      accessToken,
    },
  });

  await logAudit({
    staffId: staff.id,
    tenantId: params.tenantId,
    action: "tenant.integration.whatsapp.updated",
    metadata: { phoneNumberId, displayPhoneNumber },
  });

  return NextResponse.json(
    { id: config.id, phoneNumberId: config.phoneNumberId, displayPhoneNumber: config.displayPhoneNumber },
    { status: 201 }
  );
}
