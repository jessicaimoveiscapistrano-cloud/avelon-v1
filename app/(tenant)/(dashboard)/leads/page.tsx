"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
    <div className="p-8">
      <div className="flex justify-between mb-4">
        <h1 className="text-xl font-semibold">Leads</h1>
        <Link href="/leads/novo" className="bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm">+ Novo lead</Link>
      </div>
      <input placeholder="Buscar..." value={q} onChange={(e) => setQ(e.target.value)}
        className="border rounded-lg px-3 py-2 text-sm mb-4 w-80" />
      <div className="bg-white border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr><th className="p-3">Nome</th><th className="p-3">Telefone</th><th className="p-3">Cidade</th><th className="p-3">Status</th></tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={4} className="p-6 text-center text-slate-400">Carregando...</td></tr> :
              leads.map((l) => (
                <tr key={l.id} onClick={() => router.push(`/leads/${l.id}/editar`)} className="border-t hover:bg-slate-50 cursor-pointer">
                  <td className="p-3 font-medium">{l.name}</td>
                  <td className="p-3">{l.phone}</td>
                  <td className="p-3">{l.city}</td>
                  <td className="p-3">{l.statusKey}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
