// server/services/access/features.ts
//
// Ponto único de checagem de feature contratada. Segue o mesmo princípio
// de hasPermission: nenhuma rota decide sozinha "esse tenant pode usar
// isso" — sempre resolvido aqui, a partir de Subscription → Plan →
// PlanFeature, com TenantFeatureOverride tendo prioridade.
//
// V1: só a feature CRM_LEADS/CRM_KANBAN/CRM_AGENDA/CRM_RELATORIOS/
// CRM_WHATSAPP são efetivamente consultadas (módulo CRM é o único
// funcional). A função já resolve corretamente qualquer feature futura
// do catálogo (IA_ASSISTENTE, BI_DASHBOARDS etc.) sem precisar de código
// novo quando esses módulos forem implementados — só passam a ser
// chamadas de algum lugar.

import { prisma } from "@/server/prisma/client";
import { SubscriptionStatus } from "@prisma/client";

// cache por tenant — subscription/plano muda raramente, evita hit no
// banco em toda navegação de página
type TenantFeatureCache = { features: Set<string>; expiresAt: number };
const cache = new Map<string, TenantFeatureCache>();
const CACHE_TTL_MS = 60_000;

const ACTIVE_STATUSES: SubscriptionStatus[] = ["ACTIVE", "TRIAL"];

async function loadTenantFeatures(tenantId: string): Promise<Set<string>> {
  const cached = cache.get(tenantId);
  if (cached && cached.expiresAt > Date.now()) return cached.features;

  const subscription = await prisma.subscription.findUnique({
    where: { tenantId },
    include: { plan: { include: { planFeatures: { include: { feature: true } } } } },
  });

  const features = new Set<string>();

  // sem subscription ativa (TRIAL/ACTIVE), nenhuma feature de plano conta
  if (subscription && ACTIVE_STATUSES.includes(subscription.status)) {
    for (const pf of subscription.plan.planFeatures) {
      features.add(pf.feature.key);
    }
  }

  // overrides pontuais valem independente do status do plano — é o
  // mecanismo pensado justamente para exceção comercial (ex: cortesia
  // durante negociação de renovação)
  const overrides = await prisma.tenantFeatureOverride.findMany({
    where: { tenantId },
    include: { feature: true },
  });
  for (const o of overrides) {
    if (o.enabled) features.add(o.feature.key);
    else features.delete(o.feature.key);
  }

  cache.set(tenantId, { features, expiresAt: Date.now() + CACHE_TTL_MS });
  return features;
}

export async function hasFeature(tenantId: string, featureKey: string): Promise<boolean> {
  const features = await loadTenantFeatures(tenantId);
  return features.has(featureKey);
}

// usado por webhooks/serviços internos que só precisam saber "o módulo
// CRM está ativo", sem se importar com a feature granular específica
export async function hasAnyCrmFeature(tenantId: string): Promise<boolean> {
  const features = await loadTenantFeatures(tenantId);
  return ["CRM_LEADS", "CRM_KANBAN", "CRM_AGENDA", "CRM_RELATORIOS", "CRM_WHATSAPP"].some((k) =>
    features.has(k)
  );
}
