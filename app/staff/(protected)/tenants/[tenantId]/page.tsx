// app/staff/tenants/[tenantId]/page.tsx

import { prisma } from "@/server/prisma/client";
import { requireStaffUser } from "@/server/auth/staffSession";
import { logAudit } from "@/server/services/audit/logAudit";
import { notFound } from "next/navigation";
import { FacebookConfigForm, WhatsAppConfigForm } from "@/components/staff/IntegrationConfigForms";

export default async function StaffTenantDetailPage({ params }: { params: { tenantId: string } }) {
  const staff = await requireStaffUser();

  const tenant = await prisma.tenant.findUnique({
    where: { id: params.tenantId },
    include: {
      organization: { select: { name: true } },
      subscription: { select: { status: true, plan: { select: { name: true } } } },
      users: { select: { id: true, name: true, email: true, role: true } },
      businessChannels: { select: { type: true, displayLabel: true } },
      technicalSources: { select: { kind: true, label: true, businessChannel: { select: { type: true } } } },
    },
  });

  if (!tenant) notFound();

  const [facebookConfigs, whatsappConfig] = await Promise.all([
    prisma.facebookPageConfig.findMany({ where: { tenantId: tenant.id } }),
    prisma.whatsAppConfig.findUnique({ where: { tenantId: tenant.id } }),
  ]);

  await logAudit({ staffId: staff.id, tenantId: tenant.id, action: "tenant.viewed" });

  return (
    <div style={{ display: "grid", gap: 24, maxWidth: 900 }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{tenant.name}</h1>
        <p style={{ color: "#6b7280", fontSize: 13 }}>
          {tenant.organization.name} · Plano {tenant.subscription?.plan.name ?? "—"} ·{" "}
          {tenant.subscription?.status ?? "SEM ASSINATURA"}
        </p>
      </div>

      <Section title="Usuários">
        <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
          <tbody>
            {tenant.users.map((u) => (
              <tr key={u.id} style={{ borderTop: "1px solid #f0efe9" }}>
                <td style={{ padding: "8px 4px", fontWeight: 600 }}>{u.name}</td>
                <td style={{ padding: "8px 4px", color: "#6b7280" }}>{u.email}</td>
                <td style={{ padding: "8px 4px", color: "#6b7280" }}>{u.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Canais comerciais e origens técnicas mapeadas">
        <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", color: "#6b7280" }}>
              <th style={{ padding: "6px 4px" }}>Canal comercial</th>
              <th style={{ padding: "6px 4px" }}>Origem técnica (kind)</th>
            </tr>
          </thead>
          <tbody>
            {tenant.technicalSources.map((ts) => (
              <tr key={ts.kind} style={{ borderTop: "1px solid #f0efe9" }}>
                <td style={{ padding: "8px 4px" }}>{ts.businessChannel?.type ?? "não mapeado"}</td>
                <td style={{ padding: "8px 4px", color: "#6b7280" }}>
                  {ts.kind} — {ts.label}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <Section title="Facebook Lead Ads">
          {facebookConfigs.length > 0 && (
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 10 }}>
              {facebookConfigs.length} página(s) já conectada(s)
            </p>
          )}
          <FacebookConfigForm tenantId={tenant.id} />
        </Section>

        <Section title="WhatsApp Cloud API">
          {whatsappConfig && (
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 10 }}>
              Conectado: {whatsappConfig.displayPhoneNumber ?? whatsappConfig.phoneNumberId}
            </p>
          )}
          <WhatsAppConfigForm tenantId={tenant.id} />
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e2d9", borderRadius: 12, padding: 18 }}>
      <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>{title}</h2>
      {children}
    </div>
  );
}
