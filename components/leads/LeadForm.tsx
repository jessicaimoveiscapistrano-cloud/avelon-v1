"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LeadForm({ initialData }: { initialData?: any }) {
  const router = useRouter();
  const isEdit = !!initialData?.id;
  const [form, setForm] = useState({
    name: initialData?.name ?? "", phone: initialData?.phone ?? "", email: initialData?.email ?? "",
    city: initialData?.city ?? "", neighborhood: initialData?.neighborhood ?? "",
    propertyPurpose: initialData?.propertyPurpose ?? "SALE", propertyType: initialData?.propertyType ?? "",
    desiredValue: initialData?.desiredValue?.toString() ?? "", observations: initialData?.observations ?? "",
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const url = isEdit ? `/api/leads/${initialData.id}` : "/api/leads";
    await fetch(url, {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    router.push("/leads");
    router.refresh();
  }

  const set = (k: string) => (v: string) => setForm({ ...form, [k]: v });

  const cardStyle: React.CSSProperties = {
    maxWidth: 640, background: "#fff", border: "1px solid #e5e2d9", borderRadius: 14, padding: 24,
    boxShadow: "0 1px 2px rgba(17,26,51,.04), 0 8px 24px -12px rgba(17,26,51,.12)",
  };

  return (
    <form onSubmit={handleSubmit} style={cardStyle}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <F label="Nome" value={form.name} onChange={set("name")} required />
        <F label="Telefone" value={form.phone} onChange={set("phone")} required />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <F label="E-mail" value={form.email} onChange={set("email")} />
        <F label="Cidade" value={form.city} onChange={set("city")} required />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <F label="Bairro" value={form.neighborhood} onChange={set("neighborhood")} />
        <div>
          <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "#3a3d45" }}>Finalidade</label>
          <select
            value={form.propertyPurpose}
            onChange={(e) => set("propertyPurpose")(e.target.value)}
            style={{ width: "100%", border: "1px solid #e5e2d9", borderRadius: 9, padding: "9px 12px", fontSize: 13.5 }}
          >
            <option value="SALE">Venda</option>
            <option value="RENT">Aluguel</option>
          </select>
        </div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <F label="Valor desejado" value={form.desiredValue} onChange={set("desiredValue")} type="number" />
      </div>
      <div style={{ marginBottom: 18 }}>
        <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "#3a3d45" }}>Observações</label>
        <textarea
          value={form.observations}
          onChange={(e) => set("observations")(e.target.value)}
          rows={3}
          style={{ width: "100%", border: "1px solid #e5e2d9", borderRadius: 9, padding: "9px 12px", fontSize: 13.5, fontFamily: "inherit" }}
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        style={{ background: "#111a33", color: "#fff", border: "none", borderRadius: 10, padding: "11px 20px", fontSize: 13.5, fontWeight: 700 }}
      >
        {loading ? "Salvando..." : isEdit ? "Salvar" : "Cadastrar"}
      </button>
    </form>
  );
}

function F({ label, value, onChange, type = "text", required }: any) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "#3a3d45" }}>{label}</label>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: "100%", border: "1px solid #e5e2d9", borderRadius: 9, padding: "9px 12px", fontSize: 13.5 }}
      />
    </div>
  );
}
