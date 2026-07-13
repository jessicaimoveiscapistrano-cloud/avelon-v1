"use client";
import { useEffect, useState } from "react";
export default function RelatoriosPage() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { fetch("/api/dashboard").then((r) => r.json()).then(setData); }, []);
  if (!data) return <div className="p-8 text-slate-400">Carregando...</div>;
  return (
    <div className="p-8 space-y-6">
      <h1 className="text-xl font-semibold">Relatórios</h1>
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border rounded-2xl p-5"><p className="text-xs text-slate-400">Total</p><p className="text-2xl font-semibold">{data.total}</p></div>
        <div className="bg-white border rounded-2xl p-5"><p className="text-xs text-slate-400">WON</p><p className="text-2xl font-semibold">{data.won.count}</p></div>
        <div className="bg-white border rounded-2xl p-5"><p className="text-xs text-slate-400">Valor WON</p><p className="text-2xl font-semibold">R$ {data.won.totalValue}</p></div>
        <div className="bg-white border rounded-2xl p-5"><p className="text-xs text-slate-400">Taxa</p><p className="text-2xl font-semibold">{(data.conversionRate*100).toFixed(1)}%</p></div>
      </div>
      <div className="bg-white border rounded-2xl p-5">
        <h2 className="font-semibold mb-3">Por canal</h2>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-slate-500"><th>Canal</th><th>Total</th><th>WON</th><th>Taxa</th></tr></thead>
          <tbody>
            {data.bySource.map((s: any) => (
              <tr key={s.channelType} className="border-t"><td>{s.channelLabel}</td><td>{s.total}</td><td>{s.won}</td><td>{(s.conversionRate*100).toFixed(1)}%</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
