"use client";
import { useEffect, useState } from "react";

export default function AgendaPage() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/agenda").then((r) => r.json()).then((d) => setItems(d.items ?? []));
  }, []);

  const groups: Record<string, any[]> = {};
  for (const item of items) {
    const day = new Date(item.date).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
    if (!groups[day]) groups[day] = [];
    groups[day].push(item);
  }

  return (
    <div style={{ padding: 28 }}>
      <h1 style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, marginBottom: 20 }}>
        Agenda
      </h1>

      {Object.keys(groups).length === 0 ? (
        <p style={{ fontSize: 13, color: "#9498a3" }}>Nada agendado.</p>
      ) : (
        Object.entries(groups).map(([day, dayItems]) => (
          <div key={day} style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "#6b7280", textTransform: "capitalize", marginBottom: 8 }}>
              {day}
            </div>
            <div style={{ background: "#fff", border: "1px solid #e5e2d9", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 2px rgba(17,26,51,.04)" }}>
              {dayItems.map((item) => {
                const overdue = !item.done && new Date(item.date) < new Date();
                return (
                  <div
                    key={item.id}
                    style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "14px 18px", borderBottom: "1px solid #f0efe9",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600 }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: "#9498a3", marginTop: 2 }}>
                        {item.leadName} · {item.leadPhone}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 12, color: "#9498a3" }}>
                        {new Date(item.date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <span
                        style={{
                          fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, marginTop: 4, display: "inline-block",
                          background: item.done ? "#e2f3ec" : overdue ? "#f8e6e3" : "#f0efe9",
                          color: item.done ? "#1f8f65" : overdue ? "#c2483f" : "#6b7280",
                        }}
                      >
                        {item.done ? "Concluído" : overdue ? "Atrasado" : item.kind === "TASK" ? "Tarefa" : "Ação"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
