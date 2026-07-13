// SUBSTITUI server/services/leads/createLead.ts inteiro
//
// Mesmo gap da distribution.ts: esta função ainda criava o Lead com
// `leadSourceId` (campo que não existe mais) e chamava assignLeadByRules
// com leadSourceKey. Atualizado para o modelo de 3 camadas da Fase 0/1:
// technicalSourceId (interno) + businessChannelId (comercial).
//
// IMPORTANTE: workspaceId agora é obrigatório em Lead — esta função
// resolve o workspace padrão do tenant automaticamente, já que as
// integrações (webhooks) não têm sessão de usuário para fornecer isso.

import { prisma } from "@/server/prisma/client";
import { PropertyPurpose } from "@prisma/client";
import { assignLeadByRules } from "./distribution";

type CreateLeadInput = {
  tenantId: string;
  name: string;
  phone: string;
  email?: string;
  city: string;
  neighborhood?: string;
  propertyType?: string;
  propertyPurpose: PropertyPurpose;
  desiredValue?: number;
  leadSourceKey: string; // technicalSource.kind — ex: "TYPEBOT_IMOVEIS", "WHATSAPP"
  leadSourceLabel: string; // technicalSource.label
  observations?: string;
  enteredAt?: Date;
  assignedToUserId?: string | null;
};

export async function createLeadWithDistribution(input: CreateLeadInput) {
  const technicalSource = await prisma.technicalSource.upsert({
    where: { tenantId_kind: { tenantId: input.tenantId, kind: input.leadSourceKey } },
    update: {},
    create: { tenantId: input.tenantId, kind: input.leadSourceKey, label: input.leadSourceLabel },
  });

  // se a technicalSource ainda não tem mapeamento comercial, cria um
  // BusinessChannel "OUTRO" para não deixar o lead sem canal comercial
  let businessChannelId = technicalSource.businessChannelId;
  if (!businessChannelId) {
    const fallbackChannel = await prisma.businessChannel.upsert({
      where: { tenantId_type: { tenantId: input.tenantId, type: "OUTRO" } },
      update: {},
      create: { tenantId: input.tenantId, type: "OUTRO", displayLabel: "Outro" },
    });
    await prisma.technicalSource.update({
      where: { id: technicalSource.id },
      data: { businessChannelId: fallbackChannel.id },
    });
    businessChannelId = fallbackChannel.id;
  }

  const defaultWorkspace = await prisma.workspace.findFirst({
    where: { tenantId: input.tenantId, isDefault: true },
  });
  if (!defaultWorkspace) {
    throw new Error(`Tenant ${input.tenantId} sem workspace padrão — dado inconsistente`);
  }

  const assignedToUserId =
    input.assignedToUserId ??
    (await assignLeadByRules({
      tenantId: input.tenantId,
      city: input.city,
      neighborhood: input.neighborhood,
      propertyPurpose: input.propertyPurpose,
      propertyType: input.propertyType,
      businessChannelId,
    }));

  const lead = await prisma.lead.create({
    data: {
      tenantId: input.tenantId,
      workspaceId: defaultWorkspace.id,
      name: input.name,
      phone: input.phone,
      email: input.email,
      city: input.city,
      neighborhood: input.neighborhood,
      propertyType: input.propertyType,
      propertyPurpose: input.propertyPurpose,
      desiredValue: input.desiredValue,
      technicalSourceId: technicalSource.id,
      businessChannelId,
      observations: input.observations,
      enteredAt: input.enteredAt,
      assignedToUserId: assignedToUserId ?? null,
    },
  });

  if (assignedToUserId) {
    await prisma.notification.create({
      data: {
        tenantId: input.tenantId,
        userId: assignedToUserId,
        type: "NEW_LEAD",
        title: "Novo lead atribuído",
        message: `${lead.name} — ${lead.city}`,
      },
    });
  }

  return lead;
}
