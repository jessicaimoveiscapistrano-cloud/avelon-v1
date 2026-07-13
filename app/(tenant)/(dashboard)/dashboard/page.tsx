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

  if (!data) return <div className="p-8 text-slate-400">Carregando...</div>;

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-xl font-semibold">Visão geral</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card label="Leads" value={data.total} />
        <Card label="Convertidos" value={data.won.count} />
        <Card label="Perdidos" value={data.lost.count} />
        <Card label="Taxa" value={`${(data.conversionRate * 100).toFixed(1)}%`} />
      </div>
      <div className="bg-white border rounded-2xl p-5">
        <h2 className="font-semibold mb-3">Próximas tarefas</h2>
        {tasks.length === 0 ? <p className="text-sm text-slate-400">Nenhuma tarefa pendente</p> :
          tasks.map((t) => (
            <div key={t.id} className="flex justify-between text-sm border-b py-2">
              <span>{t.title} — {t.lead?.name}</span>
              <span>{new Date(t.dueAt).toLocaleDateString("pt-BR")}</span>
            </div>
          ))}
      </div>
      <div className="flex gap-4 text-sm">
        <Link href="/leads/novo" className="text-indigo-600">+ Novo lead</Link>
        <Link href="/kanban" className="text-indigo-600">Kanban</Link>
        <Link href="/agenda" className="text-indigo-600">Agenda</Link>
        <Link href="/relatorios" className="text-indigo-600">Relatórios</Link>
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: any }) {
  return (
    <div className="bg-white border rounded-2xl p-5">
      <p className="text-xs uppercase text-slate-400 mb-1">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}
