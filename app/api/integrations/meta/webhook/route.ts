// app/api/integrations/meta/webhook/route.ts  (CORRIGE resíduo pré-Fase 0/1)
//
// BUG: o trecho de Facebook Lead Ads fazia `include: { source: true }` em
// FacebookPageConfig e lia `pageConfig.source.key`/`.label` — a relação é
// `technicalSource` e o campo é `kind`, não `key`, desde a Fase 0/1.
// O trecho de WhatsApp não tinha esse bug (usava strings literais), então
// só o bloco de Facebook precisou de correção.

import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma/client";
import { validateMetaSignature } from "@/server/integrations/validateMetaSignature";
import { fetchFacebookLeadData } from "@/server/integrations/facebookGraphApi";
import { normalizeFacebookLead } from "@/server/services/integrations/facebook";
import { extractMessageBody, extractContactName } from "@/server/services/integrations/whatsapp";
import { findLeadByPhone } from "@/server/services/leads/matchLeadByPhone";
import { createLeadWithDistribution } from "@/server/services/leads/createLead";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.META_VERIFY_TOKEN) {
    return new Response(challenge ?? "", { status: 200 });
  }

  return NextResponse.json({ message: "Verification failed" }, { status: 403 });
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-hub-signature-256");

  if (!validateMetaSignature(rawBody, signature, process.env.META_APP_SECRET)) {
    return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const results: { id: string; status: string }[] = [];
  const entries = Array.isArray(payload.entry) ? payload.entry : [];

  if (payload.object === "page") {
    for (const entry of entries) {
      const pageId = entry.id as string | undefined;
      const changes = Array.isArray(entry.changes) ? entry.changes : [];

      for (const change of changes) {
        if (change.field !== "leadgen") continue;

        const leadgenId = change.value?.leadgen_id as string | undefined;
        const formId = change.value?.form_id as string | undefined;

        if (!leadgenId || !pageId) {
          results.push({ id: leadgenId ?? "unknown", status: "missing_ids" });
          continue;
        }

        const pageConfig = await prisma.facebookPageConfig.findUnique({
          where: { pageId },
          include: { technicalSource: true }, // ✅ era include: { source: true }
        });

        if (!pageConfig || !pageConfig.enabled) {
          results.push({ id: leadgenId, status: "page_not_configured" });
          continue;
        }

        const leadData = await fetchFacebookLeadData(leadgenId, pageConfig.pageAccessToken);
        if (!leadData) {
          results.push({ id: leadgenId, status: "graph_api_error" });
          continue;
        }

        const normalized = normalizeFacebookLead(leadData.field_data, formId ?? "unknown", leadgenId);
        if (!normalized.ok) {
          results.push({ id: leadgenId, status: "invalid_lead_data" });
          continue;
        }

        await createLeadWithDistribution({
          tenantId: pageConfig.tenantId,
          ...normalized.data,
          leadSourceKey: pageConfig.technicalSource.kind, // ✅ era pageConfig.source.key
          leadSourceLabel: pageConfig.technicalSource.label, // ✅ era pageConfig.source.label
        });

        results.push({ id: leadgenId, status: "created" });
      }
    }
  } else if (payload.object === "whatsapp_business_account") {
    for (const entry of entries) {
      const changes = Array.isArray(entry.changes) ? entry.changes : [];

      for (const change of changes) {
        if (change.field !== "messages") continue;
        const value = change.value;

        const config = await prisma.whatsAppConfig.findUnique({
          where: { phoneNumberId: value.metadata?.phone_number_id },
        });

        if (!config || !config.enabled) {
          results.push({ id: value.metadata?.phone_number_id ?? "unknown", status: "config_not_found" });
          continue;
        }

        if (Array.isArray(value.statuses)) {
          for (const s of value.statuses) {
            await prisma.whatsAppMessage.updateMany({
              where: { waMessageId: s.id },
              data: { status: s.status.toUpperCase() as any },
            });
            results.push({ id: s.id, status: `status_updated:${s.status}` });
          }
        }

        if (Array.isArray(value.messages)) {
          for (const msg of value.messages) {
            const fromNumber = msg.from;
            const body = extractMessageBody(msg);
            const contactName = extractContactName(value, fromNumber);

            let lead = await findLeadByPhone(config.tenantId, fromNumber);

            if (!lead) {
              lead = await createLeadWithDistribution({
                tenantId: config.tenantId,
                name: contactName ?? `Contato WhatsApp ${fromNumber}`,
                phone: fromNumber,
                city: "Não informado",
                propertyPurpose: "SALE",
                leadSourceKey: "WHATSAPP",
                leadSourceLabel: "WhatsApp",
                observations: "Lead criado automaticamente a partir de mensagem no WhatsApp",
              });
            }

            await prisma.whatsAppMessage.create({
              data: {
                tenantId: config.tenantId,
                leadId: lead.id,
                direction: "INBOUND",
                fromNumber,
                toNumber: value.metadata.phone_number_id,
                body,
                waMessageId: msg.id,
                status: "RECEIVED",
              },
            });

            results.push({ id: msg.id, status: "message_saved" });
          }
        }
      }
    }
  } else {
    results.push({ id: "unknown", status: `ignored_object_type:${payload.object}` });
  }

  return NextResponse.json({ received: true, results }, { status: 200 });
}
