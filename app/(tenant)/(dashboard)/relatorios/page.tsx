"use client";
import { useEffect, useState } from "react";

export default function RelatoriosPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => { fetch("/api/dashboard").then((r) => r.json()).then(setData); }, []);

  if (!data) return <div style={{ padding: 32, color: "#9498a3" }}>Carregando...</div>;

  const kpis = [
    { label: "Total", value: data.total, color: "#181a1f" },
    { label: "WON", value: data.won.count, color: "#1f8f65" },
    { label: "Valor WON", value: `R$ ${data.won.totalValue}`, color: "#b8923f" },
    { label: "Taxa", value: `${(data.conversionRate * 100).toFixed(1)}%`, color: "#4c5fd7" },
  ];

  return (
    <div style={{ padding: 28 }}>
      <h1 style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, marginBottom: 20 }}>
        Relatórios
      </h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {kpis.map((k) => (
          <div
            key={k.label}
            style={{
              background: "#fff", border: "1px solid #e5e2d9", borderRadius: 14, padding: "18px 20px",
              boxShadow: "0 1px 2px rgba(17,26,51,.04), 0 8px 24px -12px rgba(17,26,51,.12)",
            }}
          >
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "#9498a3", marginBottom: 8 }}>
              {k.label}
            </div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 700, color: k.color }}>
              {k.value}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          background: "#fff", border: "1px solid #e5e2d9", borderRadius: 14, padding: 20,
          boxShadow: "0 1px 2px rgba(17,26,51,.04)",
        }}
      >
        <h2 style={{ fontSize: 14.5, fontWeight: 700, marginBottom: 14 }}>Por canal</h2>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "#9498a3" }}>
              <th style={{ paddingBottom: 8 }}>Canal</th>
              <th style={{ paddingBottom: 8 }}>Total</th>
              <th style={{ paddingBottom: 8 }}>WON</th>
              <th style={{ paddingBottom: 8 }}>Taxa</th>
            </tr>
          </thead>
          <tbody>
            {data.bySource.map((s: any) => (
              <tr key={s.channelType} style={{ borderTop: "1px solid #f0efe9" }}>
                <td style={{ padding: "10px 0" }}>{s.channelLabel}</td>
                <td>{s.total}</td>
                <td style={{ color: "#1f8f65", fontWeight: 600 }}>{s.won}</td>
                <td>{(s.conversionRate * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
