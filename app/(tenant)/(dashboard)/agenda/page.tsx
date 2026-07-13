"use client";
import { useEffect, useState } from "react";
export default function AgendaPage() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => { fetch("/api/agenda").then((r) => r.json()).then((d) => setItems(d.items)); }, []);
  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold mb-6">Agenda</h1>
      <div className="bg-white border rounded-2xl divide-y">
        {items.map((i) => (
          <div key={i.id} className="flex justify-between p-4 text-sm">
            <span>{i.title} — {i.leadName}</span>
            <span>{new Date(i.date).toLocaleString("pt-BR")}</span>
          </div>
        ))}
        {items.length === 0 && <p className="p-6 text-center text-slate-400">Nada agendado</p>}
      </div>
    </div>
  );
}
