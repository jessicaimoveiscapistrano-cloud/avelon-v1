// app/api/leads/[leadId]/whatsapp/route.ts  (CORRIGE brecha de escopo — Fase 5 nunca cobriu esta rota)
//
// BUG DE SEGURANÇA ENCONTRADO NA VARREDURA: este endpoint (histórico +
// envio de WhatsApp por lead) nunca recebeu a checagem canAccessLead da
// Fase 5. Sem isso, um corretor conseguia ler e ENVIAR mensagem em nome
// da imobiliária num lead que não é dele — pior que só vazamento de
// leitura, é ação indevida em nome de terceiro.

import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma/client";
import { requireApiUser } from "@/server/auth/apiAuth";
import { canAccessLead } from "@/server/services/access/resolveLeadScope";
import { sendWhatsAppTextMessage } from "@/server/integrations/whatsappGraphApi";

export async function GET(req: Request, { params }: { params: { leadId: string } }) {
  const { user, response } = await requireApiUser();
  if (!user) return response;

  const lead = await prisma.lead.findUnique({ where: { id: params.leadId } });
  if (!lead || !(await canAccessLead(user, lead))) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const messages = await prisma.whatsAppMessage.findMany({
    where: { tenantId: user.tenantId, leadId: params.leadId },
    orderBy: { createdAt: "asc" },
    include: { sentByUser: { select: { name: true } } },
  });

  return NextResponse.json(messages);
}

export async function POST(req: Request, { params }: { params: { leadId: string } }) {
  const { user, response } = await requireApiUser();
  if (!user) return response;

  const lead = await prisma.lead.findUnique({ where: { id: params.leadId } });
  if (!lead || !(await canAccessLead(user, lead))) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const config = await prisma.whatsAppConfig.findUnique({ where: { tenantId: user.tenantId } });
  if (!config || !config.enabled) {
    return NextResponse.json({ message: "WhatsApp não configurado para este tenant" }, { status: 422 });
  }

  const body = await req.json();
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    return NextResponse.json({ message: "Mensagem vazia" }, { status: 422 });
  }

  const result = await sendWhatsAppTextMessage(config.phoneNumberId, config.accessToken, lead.phone, text);

  const message = await prisma.whatsAppMessage.create({
    data: {
      tenantId: user.tenantId,
      leadId: lead.id,
      direction: "OUTBOUND",
      fromNumber: config.phoneNumberId,
      toNumber: lead.phone,
      body: text,
      waMessageId: result.ok ? result.waMessageId : null,
      status: result.ok ? "SENT" : "FAILED",
      sentByUserId: user.id,
    },
  });

  if (!result.ok) {
    return NextResponse.json({ message: result.error, whatsappMessage: message }, { status: 502 });
  }

  return NextResponse.json(message, { status: 201 });
}
