"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/dashboard").then((r) => r.json()).then(setData);
    fetch("/api/tasks/upcoming").then((r) => r.json()).then(setTasks);
  }, []);

  if (!data) return <div style={{ padding: 32, color: "#9498a3" }}>Carregando...</div>;

  const kpis = [
    { label: "Leads", value: data.total, color: "#181a1f" },
    { label: "Convertidos", value: data.won.count, color: "#1f8f65" },
    { label: "Perdidos", value: data.lost.count, color: "#c2483f" },
    { label: "Taxa", value: `${(data.conversionRate * 100).toFixed(1)}%`, color: "#b8923f" },
  ];

  return (
    <div style={{ padding: 28 }}>
      <h1 style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, marginBottom: 20 }}>
        Visão geral
      </h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {kpis.map((k) => (
          <div
            key={k.label}
            style={{
              background: "#fff",
              border: "1px solid #e5e2d9",
              borderRadius: 14,
              padding: "18px 20px",
              boxShadow: "0 1px 2px rgba(17,26,51,.04), 0 8px 24px -12px rgba(17,26,51,.12)",
            }}
          >
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "#9498a3", marginBottom: 8 }}>
              {k.label}
            </div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 28, fontWeight: 700, color: k.color }}>
              {k.value}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e2d9",
          borderRadius: 14,
          padding: 20,
          marginBottom: 20,
          boxShadow: "0 1px 2px rgba(17,26,51,.04), 0 8px 24px -12px rgba(17,26,51,.12)",
        }}
      >
        <h2 style={{ fontSize: 14.5, fontWeight: 700, marginBottom: 12 }}>Próximas tarefas</h2>
        {tasks.length === 0 ? (
          <p style={{ fontSize: 13, color: "#9498a3" }}>Nenhuma tarefa pendente</p>
        ) : (
          tasks.map((t) => (
            <div
              key={t.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "11px 0",
                borderBottom: "1px solid #f0efe9",
                fontSize: 13.5,
              }}
            >
              <span>
                <strong>{t.title}</strong> — {t.lead?.name}
              </span>
              <span style={{ color: "#9498a3" }}>{new Date(t.dueAt).toLocaleDateString("pt-BR")}</span>
            </div>
          ))
        )}
      </div>

      <div style={{ display: "flex", gap: 16, fontSize: 13.5 }}>
        <Link href="/leads/novo" style={{ color: "#111a33", fontWeight: 600 }}>+ Novo lead</Link>
        <Link href="/kanban" style={{ color: "#111a33", fontWeight: 600 }}>Kanban</Link>
        <Link href="/agenda" style={{ color: "#111a33", fontWeight: 600 }}>Agenda</Link>
        <Link href="/relatorios" style={{ color: "#111a33", fontWeight: 600 }}>Relatórios</Link>
      </div>
    </div>
  );
}
