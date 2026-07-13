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

  return (
    <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
      <form onSubmit={handleSubmit} className="bg-white border rounded-2xl p-5 space-y-3">
        <h2 className="font-semibold mb-2">Novo usuário</h2>
        <input placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
        <input placeholder="E-mail" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm">
          <option value="CORRECTOR">Corretor</option><option value="MANAGER">Gerente</option><option value="OWNER">Owner</option>
        </select>
        <input type="password" placeholder="Senha provisória" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
        <button className="w-full bg-indigo-600 text-white rounded-lg py-2 text-sm">Criar</button>
      </form>
      <div className="lg:col-span-2 bg-white border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500"><tr><th className="p-3">Nome</th><th>E-mail</th><th>Função</th></tr></thead>
          <tbody>{users.map((u: any) => (<tr key={u.id} className="border-t"><td className="p-3">{u.name}</td><td>{u.email}</td><td>{u.role}</td></tr>))}</tbody>
        </table>
      </div>
    </div>
  );
}
