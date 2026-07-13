// app/staff/page.tsx
//
// Placeholder deliberadamente mínimo. O objetivo desta Fase 2 é validar o
// ciclo completo de autenticação de staff (login → sessão → rota
// protegida → logout) — não construir telas de gestão de tenants,
// integrações técnicas ou billing. Isso é escopo da Fase 7.

import { requireStaffUser } from "@/server/auth/staffSession";

export default async function StaffHomePage() {
  const staff = await requireStaffUser();

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
        Bem-vindo(a), {staff.name}
      </h1>
      <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 24 }}>
        Papel: {staff.role} · Sessão de staff válida e isolada da sessão de
        clientes.
      </p>
      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e2d9",
          borderRadius: 12,
          padding: 20,
          maxWidth: 520,
          fontSize: 13,
          color: "#6b7280",
        }}
      >
        Este é um placeholder da Fase 2. Gestão de tenants, organizations,
        integrações técnicas, auditoria e saúde da plataforma chegam na
        Fase 7, conforme o plano de implementação aprovado.
      </div>
    </div>
  );
}
