"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const STATUS_LABELS: Record<string, string> = {
  NEW: "Novo", FIRST_CONTACT: "1º Contato", IN_PROGRESS: "Em andamento",
  SCHEDULED_VISIT: "Visita agendada", VISITED: "Visitado", PROPOSAL: "Proposta",
  NEGOTIATION: "Negociação", CONTRACT: "Contrato", WON: "Convertido", LOST: "Perdido",
};

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  NEW: { bg: "#e8eafc", fg: "#4c5fd7" },
  WON: { bg: "#e2f3ec", fg: "#1f8f65" },
  LOST: { bg: "#f8e6e3", fg: "#c2483f" },
};

export default function LeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    fetch(`/api/leads?${params}`).then((r) => r.json()).then(setLeads).finally(() => setLoading(false));
  }, [q]);

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700 }}>Leads</h1>
        <Link
          href="/leads/novo"
          style={{ background: "#111a33", color: "#fff", borderRadius: 10, padding: "10px 16px", fontSize: 13.5, fontWeight: 600, textDecoration: "none" }}
        >
          + Novo lead
        </Link>
      </div>

      <input
        placeholder="Buscar por nome, telefone, cidade..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        style={{ border: "1px solid #e5e2d9", borderRadius: 9, padding: "9px 12px", fontSize: 13.5, marginBottom: 16, width: 320 }}
      />

      <div style={{ background: "#fff", border: "1px solid #e5e2d9", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 2px rgba(17,26,51,.04)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", background: "#faf9f5" }}>
              <th style={{ padding: "12px 16px", fontSize: 11, textTransform: "uppercase", color: "#9498a3" }}>Nome</th>
              <th style={{ padding: "12px 16px", fontSize: 11, textTransform: "uppercase", color: "#9498a3" }}>Telefone</th>
              <th style={{ padding: "12px 16px", fontSize: 11, textTransform: "uppercase", color: "#9498a3" }}>Cidade</th>
              <th style={{ padding: "12px 16px", fontSize: 11, textTransform: "uppercase", color: "#9498a3" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ padding: 24, textAlign: "center", color: "#9498a3" }}>Carregando...</td></tr>
            ) : leads.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: 24, textAlign: "center", color: "#9498a3" }}>Nenhum lead encontrado</td></tr>
            ) : (
              leads.map((l) => {
                const c = STATUS_COLORS[l.statusKey] ?? { bg: "#f0efe9", fg: "#6b7280" };
                return (
                  <tr
                    key={l.id}
                    onClick={() => router.push(`/leads/${l.id}/editar`)}
                    style={{ borderTop: "1px solid #f0efe9", cursor: "pointer" }}
                  >
                    <td style={{ padding: "12px 16px", fontSize: 13.5, fontWeight: 600 }}>{l.name}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13.5 }}>{l.phone}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13.5 }}>{l.city}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ background: c.bg, color: c.fg, fontSize: 11.5, fontWeight: 600, padding: "3px 9px", borderRadius: 20 }}>
                        {STATUS_LABELS[l.statusKey] ?? l.statusKey}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
