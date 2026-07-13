// SUBSTITUI server/services/leads/distribution.ts inteiro
//
// Gap encontrado na Fase 5: LeadDistributionRule migrou de
// `leadSourceKey` (string solta) para `businessChannelId` (FK) na
// Fase 0/1 (ARCHITECTURE.md, decisão #10), mas este serviço nunca foi
// atualizado — assignLeadByRules ainda filtrava por leadSourceKey, que
// não existe mais no schema. distribution/auto quebraria em runtime.

import { prisma } from "@/server/prisma/client";
import { PropertyPurpose } from "@prisma/client";

type AssignInput = {
  tenantId: string;
  city: string;
  neighborhood?: string;
  propertyPurpose: PropertyPurpose;
  propertyType?: string;
  businessChannelId?: string; // ✅ era leadSourceKey
};

export async function assignLeadByRules(input: AssignInput): Promise<string | null> {
  const rules = await prisma.leadDistributionRule.findMany({
    where: { tenantId: input.tenantId, isActive: true },
    orderBy: { priority: "desc" },
  });

  for (const rule of rules) {
    if (rule.city && rule.city.toLowerCase() !== input.city.toLowerCase()) continue;
    if (rule.neighborhood && rule.neighborhood.toLowerCase() !== (input.neighborhood ?? "").toLowerCase()) continue;
    if (rule.propertyPurpose && rule.propertyPurpose !== input.propertyPurpose) continue;
    if (rule.propertyType && rule.propertyType.toLowerCase() !== (input.propertyType ?? "").toLowerCase()) continue;
    if (rule.businessChannelId && rule.businessChannelId !== input.businessChannelId) continue;

    if (rule.mode === "MANUAL" || rule.mode === "BY_CITY" || rule.mode === "BY_CORRECTOR") {
      if (rule.assignedToUserId) return rule.assignedToUserId;
      continue;
    }

    if (rule.mode === "ROUND_ROBIN") {
      const order: string[] = rule.roundRobinUserOrder
        ? JSON.parse(rule.roundRobinUserOrder as string)
        : [];
      if (order.length === 0) continue;

      const nextIndex = rule.roundRobinIndex % order.length;
      const nextUserId = order[nextIndex];

      await prisma.leadDistributionRule.update({
        where: { id: rule.id },
        data: { roundRobinIndex: (rule.roundRobinIndex + 1) % order.length },
      });

      return nextUserId;
    }
  }

  return null;
}
