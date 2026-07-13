// components/staff/IntegrationConfigForms.tsx
//
// Client components que falam com /api/admin/tenants/:id/integrations/**
// (já protegidas por requireApiStaff desde a Fase 4). Só existem sob
// /staff/**, então nunca são incluídas no bundle carregado pelo tenant.

"use client";

import { useState } from "react";

export function FacebookConfigForm({ tenantId }: { tenantId: string }) {
  const [form, setForm] = useState({ pageId: "", pageName: "", pageAccessToken: "" });
  const [status, setStatus] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);

    const res = await fetch(`/api/admin/tenants/${tenantId}/integrations/facebook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setStatus(res.ok ? "Salvo com sucesso." : "Erro ao salvar.");
    if (res.ok) setForm({ pageId: "", pageName: "", pageAccessToken: "" });
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <Field label="Page ID" value={form.pageId} onChange={(v) => setForm({ ...form, pageId: v })} />
      <Field label="Nome da página" value={form.pageName} onChange={(v) => setForm({ ...form, pageName: v })} />
      <Field
        label="Page Access Token"
        value={form.pageAccessToken}
        onChange={(v) => setForm({ ...form, pageAccessToken: v })}
        type="password"
      />
      <button type="submit" style={buttonStyle}>Salvar Facebook</button>
      {status && <p style={{ fontSize: 12, color: "#6b7280" }}>{status}</p>}
    </form>
  );
}

export function WhatsAppConfigForm({ tenantId }: { tenantId: string }) {
  const [form, setForm] = useState({
    phoneNumberId: "",
    businessAccountId: "",
    displayPhoneNumber: "",
    accessToken: "",
  });
  const [status, setStatus] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);

    const res = await fetch(`/api/admin/tenants/${tenantId}/integrations/whatsapp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setStatus(res.ok ? "Salvo com sucesso." : "Erro ao salvar.");
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <Field label="Phone Number ID" value={form.phoneNumberId} onChange={(v) => setForm({ ...form, phoneNumberId: v })} />
      <Field label="Business Account ID" value={form.businessAccountId} onChange={(v) => setForm({ ...form, businessAccountId: v })} />
      <Field label="Número exibido" value={form.displayPhoneNumber} onChange={(v) => setForm({ ...form, displayPhoneNumber: v })} />
      <Field label="Access Token" value={form.accessToken} onChange={(v) => setForm({ ...form, accessToken: v })} type="password" />
      <button type="submit" style={buttonStyle}>Salvar WhatsApp</button>
      {status && <p style={{ fontSize: 12, color: "#6b7280" }}>{status}</p>}
    </form>
  );
}

function Field({
  label, value, onChange, type = "text",
}: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, color: "#6b7280", marginBottom: 4 }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e5e2d9", fontSize: 13 }}
      />
    </div>
  );
}

const buttonStyle: React.CSSProperties = {
  background: "#111a33",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "9px 14px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  alignSelf: "flex-start",
};
