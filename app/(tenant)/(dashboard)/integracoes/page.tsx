"use client";
import { useEffect, useState } from "react";

type IntegrationStatus = { canal: string; label: string; conectado: boolean };

export default function IntegracoesPage() {
  const [integracoes, setIntegracoes] = useState<IntegrationStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/integrations/status")
      .then((r) => r.json())
      .then((d) => setIntegracoes(d.integracoes ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: 28, maxWidth: 640 }}>
      <h1 style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
        Integrações
      </h1>
      <p style={{ fontSize: 13, color: "#9498a3", marginBottom: 20 }}>
        Canais conectados ao seu CRM. Para conectar um novo canal, fale com seu consultor Avelon.
      </p>

      {loading ? (
        <p style={{ fontSize: 13, color: "#9498a3" }}>Carregando...</p>
      ) : (
        <div style={{ background: "#fff", border: "1px solid #e5e2d9", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 2px rgba(17,26,51,.04)" }}>
          {integracoes.map((i) => (
            <div
              key={i.canal}
              style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "16px 18px", borderBottom: "1px solid #f0efe9",
              }}
            >
              <span style={{ fontSize: 13.5, fontWeight: 600 }}>{i.label}</span>
              <span
                style={{
                  fontSize: 11.5, fontWeight: 600, padding: "3px 9px", borderRadius: 20,
                  background: i.conectado ? "#e2f3ec" : "#f0efe9",
                  color: i.conectado ? "#1f8f65" : "#6b7280",
                }}
              >
                {i.conectado ? "Conectado" : "Não conectado"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
