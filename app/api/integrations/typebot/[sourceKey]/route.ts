// app/api/integrations/typebot/[sourceKey]/route.ts  (CORRIGE resíduo pré-Fase 0/1)
//
// BUG: `webhook.source.label` — a relação se chama `technicalSource` desde
// a Fase 0/1. Corrigido junto com validateWebhook.ts nesta sprint.

import { NextResponse } from "next/server";
import { validateWebhookSecret } from "@/server/integrations/validateWebhook";
import { createLeadWithDistribution } from "@/server/services/leads/createLead";
import { normalizeTypebotPayload } from "@/server/services/integrations/typebot";

export async function POST(
  req: Request,
  { params }: { params: { sourceKey: string } }
) {
  const webhook = await validateWebhookSecret(req, params.sourceKey);
  if (!webhook) {
    return NextResponse.json({ message: "Invalid webhook secret" }, { status: 401 });
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON payload" }, { status: 400 });
  }

  const normalized = normalizeTypebotPayload(payload);
  if (!normalized.ok) {
    return NextResponse.json({ message: normalized.error }, { status: 422 });
  }

  const lead = await createLeadWithDistribution({
    tenantId: webhook.tenantId,
    ...normalized.data,
    leadSourceKey: params.sourceKey,
    leadSourceLabel: webhook.technicalSource.label, // ✅ era webhook.source.label
  });

  return NextResponse.json(lead, { status: 201 });
}
