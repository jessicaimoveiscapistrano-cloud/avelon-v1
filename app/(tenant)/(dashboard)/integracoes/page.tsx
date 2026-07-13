// app/(tenant)/(dashboard)/integracoes/page.tsx
//
// SUBSTITUI app/(tenant)/(dashboard)/integracoes/facebook/page.tsx e
// .../whatsapp/page.tsx (ambas devem ser DELETADAS — tinham formulário
// pedindo Page Access Token / WhatsApp Access Token, exatamente o que não
// pode aparecer para o cliente).
//
// Esta tela é só leitura. Conectar/configurar um canal é ação da Avelon
// Platform (Fase 7), não do tenant.

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
    <div className="p-8 max-w-2xl">
      <h1 className="text-xl font-semibold text-slate-900 mb-2">Integrações</h1>
      <p className="text-sm text-slate-500 mb-6">
        Canais conectados ao seu CRM. Para conectar um novo canal, fale com
        seu consultor Avelon.
      </p>

      {loading ? (
        <p className="text-sm text-slate-400">Carregando...</p>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100">
          {integracoes.map((i) => (
            <div key={i.canal} className="flex items-center justify-between p-4">
              <span className="text-sm font-medium text-slate-800">{i.label}</span>
              <span
                className={`text-xs rounded-full px-2 py-0.5 ${
                  i.conectado ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                }`}
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
