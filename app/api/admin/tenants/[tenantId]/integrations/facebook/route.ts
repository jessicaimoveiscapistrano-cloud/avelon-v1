// app/api/admin/tenants/[tenantId]/integrations/facebook/route.ts
//
// Substitui o antigo app/api/integrations/facebook/pages/route.ts
// (DELETAR esse arquivo antigo — ele expunha pageAccessToken no
// namespace do tenant). Só sessão de staff acessa; tenantId vem
// explícito na URL porque quem chama está gerenciando um tenant
// específico, não operando dentro do próprio.

import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma/client";
import { requireApiStaff } from "@/server/auth/staffSession";
import { logAudit } from "@/server/services/audit/logAudit";

export async function GET(req: Request, { params }: { params: { tenantId: string } }) {
  const { staff, response } = await requireApiStaff();
  if (!staff) return response;

  const configs = await prisma.facebookPageConfig.findMany({
    where: { tenantId: params.tenantId },
    select: {
      id: true,
      pageId: true,
      pageName: true,
      enabled: true,
      createdAt: true,
      technicalSource: { select: { kind: true, label: true } },
      // pageAccessToken NUNCA sai daqui — nem para o staff via esta rota de
      // listagem; se precisar reexibir para edição, criar endpoint
      // dedicado que audita explicitamente essa leitura
    },
  });

  await logAudit({
    staffId: staff.id,
    tenantId: params.tenantId,
    action: "tenant.integration.facebook.viewed",
  });

  return NextResponse.json(configs);
}

export async function POST(req: Request, { params }: { params: { tenantId: string } }) {
  const { staff, response } = await requireApiStaff();
  if (!staff) return response;

  const body = await req.json();
  const { pageId, pageName, pageAccessToken } = body;

  if (!pageId || !pageAccessToken) {
    return NextResponse.json(
      { message: "pageId e pageAccessToken são obrigatórios" },
      { status: 422 }
    );
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: params.tenantId } });
  if (!tenant) {
    return NextResponse.json({ message: "Tenant não encontrado" }, { status: 404 });
  }

  const technicalSource = await prisma.technicalSource.upsert({
    where: { tenantId_kind: { tenantId: params.tenantId, kind: "FACEBOOK_LEADS" } },
    update: {},
    create: {
      tenantId: params.tenantId,
      kind: "FACEBOOK_LEADS",
      label: "Facebook Lead Ads (Graph API)",
    },
  });

  // garante o mapeamento para o BusinessChannel comercial "Facebook"
  const businessChannel = await prisma.businessChannel.upsert({
    where: { tenantId_type: { tenantId: params.tenantId, type: "FACEBOOK" } },
    update: {},
    create: { tenantId: params.tenantId, type: "FACEBOOK", displayLabel: "Facebook" },
  });

  if (technicalSource.businessChannelId !== businessChannel.id) {
    await prisma.technicalSource.update({
      where: { id: technicalSource.id },
      data: { businessChannelId: businessChannel.id },
    });
  }

  const config = await prisma.facebookPageConfig.upsert({
    where: { pageId },
    update: { pageAccessToken, pageName, tenantId: params.tenantId, technicalSourceId: technicalSource.id },
    create: {
      tenantId: params.tenantId,
      technicalSourceId: technicalSource.id,
      pageId,
      pageName,
      pageAccessToken,
    },
  });

  await logAudit({
    staffId: staff.id,
    tenantId: params.tenantId,
    action: "tenant.integration.facebook.updated",
    metadata: { pageId, pageName },
  });

  return NextResponse.json({ id: config.id, pageId: config.pageId, pageName: config.pageName }, { status: 201 });
}
