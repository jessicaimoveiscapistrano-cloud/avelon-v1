// app/api/integrations/ingest/[sourceKey]/route.ts  (CORRIGE resíduo pré-Fase 0/1)

import { NextResponse } from "next/server";
import { validateWebhookSecret } from "@/server/integrations/validateWebhook";
import { createLeadWithDistribution } from "@/server/services/leads/createLead";
import { normalizePurpose } from "@/server/services/integrations/normalize";

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export async function POST(
  req: Request,
  { params }: { params: { sourceKey: string } }
) {
  const webhook = await validateWebhookSecret(req, params.sourceKey);
  if (!webhook) {
    return NextResponse.json({ message: "Invalid webhook secret" }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON payload" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const phoneRaw = typeof body.phone === "string" ? body.phone.trim() : "";
  const city = typeof body.city === "string" ? body.city.trim() : "";

  const missing: string[] = [];
  if (!name) missing.push("name");
  if (!phoneRaw) missing.push("phone");
  if (!city) missing.push("city");

  if (missing.length > 0) {
    return NextResponse.json(
      { message: `Campos obrigatórios faltando: ${missing.join(", ")}` },
      { status: 422 }
    );
  }

  const desiredValue =
    body.desiredValue !== undefined && body.desiredValue !== null && body.desiredValue !== ""
      ? Number(body.desiredValue)
      : undefined;

  if (desiredValue !== undefined && !Number.isFinite(desiredValue)) {
    return NextResponse.json({ message: "desiredValue inválido" }, { status: 422 });
  }

  const lead = await createLeadWithDistribution({
    tenantId: webhook.tenantId,
    name,
    phone: onlyDigits(phoneRaw),
    email: typeof body.email === "string" ? body.email.trim() || undefined : undefined,
    city,
    neighborhood: typeof body.neighborhood === "string" ? body.neighborhood.trim() || undefined : undefined,
    propertyType: typeof body.propertyType === "string" ? body.propertyType.trim() || undefined : undefined,
    propertyPurpose: normalizePurpose(body.propertyPurpose) ?? "SALE",
    desiredValue,
    leadSourceKey: params.sourceKey,
    leadSourceLabel:
      typeof body.sourceLabel === "string" ? body.sourceLabel : webhook.technicalSource.label, // ✅ era webhook.source.label
    observations: typeof body.observations === "string" ? body.observations : undefined,
    enteredAt: body.createdAt ? new Date(body.createdAt) : undefined,
    assignedToUserId: typeof body.assignedToUserId === "string" ? body.assignedToUserId : null,
  });

  return NextResponse.json(lead, { status: 201 });
}
