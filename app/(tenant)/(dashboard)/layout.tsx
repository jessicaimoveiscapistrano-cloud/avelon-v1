// app/(tenant)/(dashboard)/layout.tsx  (VERSÃO FINAL — nunca tinha sido
// persistida fisicamente; consolida aqui o patch de nav pendente da
// Sprint 1 e o novo gate de feature da Fase 6)

import Link from "next/link";
import { requireTenantUser } from "@/server/auth/requireTenant";
import { hasAnyCrmFeature } from "@/server/services/access/features";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/leads", label: "Leads" },
  { href: "/kanban", label: "Kanban" },
  { href: "/agenda", label: "Agenda" },
  { href: "/relatorios", label: "Relatórios" },
  { href: "/usuarios", label: "Usuários" },
  { href: "/integracoes", label: "Integrações" }, // ✅ consolidado (era 2 links técnicos)
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireTenantUser();

  // ✅ Fase 6: ponto único de gate de módulo contratado. V1 só vende CRM,
  // então isto é uma formalidade hoje — mas é o mesmo lugar que vai
  // bloquear acesso caso um plano seja cancelado/vencido no futuro, sem
  // precisar espalhar a checagem por rota.
  const crmActive = await hasAnyCrmFeature(user.tenantId);

  if (!crmActive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-8">
        <div className="max-w-md text-center">
          <h1 className="text-lg font-semibold text-slate-900 mb-2">
            Módulo CRM indisponível
          </h1>
          <p className="text-sm text-slate-500">
            Sua assinatura não está ativa no momento. Entre em contato com
            seu consultor Avelon para regularizar o acesso.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-56 bg-white border-r border-slate-200 p-4 flex flex-col">
        <p className="text-sm font-semibold text-slate-900 mb-6">Avelon CRM</p>
        <nav className="space-y-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block text-sm text-slate-600 hover:bg-slate-100 rounded-lg px-3 py-2"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-500">{user.name}</p>
          <p className="text-xs text-slate-400">{user.role}</p>
        </div>
      </aside>
      <main className="flex-1">{children}</main>
    </div>
  );
}
