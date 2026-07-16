"use client";
import { useEffect, useState } from "react";

export default function UsuariosPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", email: "", phone: "", role: "CORRECTOR", password: "" });

  function load() { fetch("/api/users").then((r) => r.json()).then(setUsers); }
  useEffect(load, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setForm({ name: "", email: "", phone: "", role: "CORRECTOR", password: "" });
    load();
  }

  const cardStyle: React.CSSProperties = {
    background: "#fff", border: "1px solid #e5e2d9", borderRadius: 14,
    boxShadow: "0 1px 2px rgba(17,26,51,.04), 0 8px 24px -12px rgba(17,26,51,.12)",
  };
  const inputStyle: React.CSSProperties = {
    width: "100%", border: "1px solid #e5e2d9", borderRadius: 9, padding: "9px 12px", fontSize: 13.5,
  };

  const roleColors: Record<string, { bg: string; fg: string }> = {
    OWNER: { bg: "#f1e6cd", fg: "#946a12" },
    MANAGER: { bg: "#e8eafc", fg: "#4c5fd7" },
    CORRECTOR: { bg: "#f0efe9", fg: "#6b7280" },
  };

  return (
    <div style={{ padding: 28, display: "grid", gridTemplateColumns: "340px 1fr", gap: 24 }}>
      <form onSubmit={handleSubmit} style={{ ...cardStyle, padding: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Novo usuário</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} />
          <input placeholder="E-mail" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={inputStyle} />
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} style={inputStyle}>
            <option value="CORRECTOR">Corretor</option>
            <option value="MANAGER">Gerente</option>
            <option value="OWNER">Owner</option>
          </select>
          <input type="password" placeholder="Senha provisória" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} style={inputStyle} />
          <button style={{ background: "#111a33", color: "#fff", border: "none", borderRadius: 9, padding: "10px 0", fontSize: 13.5, fontWeight: 700 }}>
            Criar
          </button>
        </div>
      </form>

      <div style={{ ...cardStyle, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
          <thead>
            <tr style={{ background: "#faf9f5", textAlign: "left" }}>
              <th style={{ padding: "12px 16px", fontSize: 11, textTransform: "uppercase", color: "#9498a3" }}>Nome</th>
              <th style={{ padding: "12px 16px", fontSize: 11, textTransform: "uppercase", color: "#9498a3" }}>E-mail</th>
              <th style={{ padding: "12px 16px", fontSize: 11, textTransform: "uppercase", color: "#9498a3" }}>Função</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u: any) => {
              const c = roleColors[u.role] ?? roleColors.CORRECTOR;
              return (
                <tr key={u.id} style={{ borderTop: "1px solid #f0efe9" }}>
                  <td style={{ padding: "12px 16px", fontWeight: 600 }}>{u.name}</td>
                  <td style={{ padding: "12px 16px", color: "#6b7280" }}>{u.email}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ background: c.bg, color: c.fg, fontSize: 11.5, fontWeight: 600, padding: "3px 9px", borderRadius: 20 }}>
                      {u.role}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
