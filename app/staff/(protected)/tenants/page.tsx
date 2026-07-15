// app/staff/tenants/page.tsx
//
// Server Component — usa prisma diretamente (mesmo padrão já usado nas
// páginas do lado tenant, ex: leads/novo/page.tsx). requireStaffUser() é
// redundante com o middleware, mas segue o padrão de defesa em
// profundidade já estabelecido.

import Link from "next/link";
import { prisma } from "@/server/prisma/client";
import { requireStaffUser } from "@/server/auth/staffSession";

export default async function StaffTenantsPage() {
  await requireStaffUser();

  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      organization: { select: { name: true } },
      subscription: { select: { status: true, plan: { select: { name: true } } } },
      _count: { select: { users: true, leads: true } },
    },
  });

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Tenants</h1>
      <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 20 }}>
        {tenants.length} imobiliária(s) cadastrada(s)
      </p>

      <div style={{ background: "#fff", border: "1px solid #e5e2d9", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", background: "#faf9f5", color: "#6b7280" }}>
              <th style={{ padding: "10px 14px" }}>Tenant</th>
              <th style={{ padding: "10px 14px" }}>Organization</th>
              <th style={{ padding: "10px 14px" }}>Plano</th>
              <th style={{ padding: "10px 14px" }}>Status</th>
              <th style={{ padding: "10px 14px" }}>Usuários</th>
              <th style={{ padding: "10px 14px" }}>Leads</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((t) => (
              <tr key={t.id} style={{ borderTop: "1px solid #f0efe9" }}>
                <td style={{ padding: "10px 14px", fontWeight: 600 }}>
                  <Link href={`/staff/tenants/${t.id}`} style={{ color: "#111a33" }}>
                    {t.name}
                  </Link>
                </td>
                <td style={{ padding: "10px 14px", color: "#6b7280" }}>{t.organization.name}</td>
                <td style={{ padding: "10px 14px" }}>{t.subscription?.plan.name ?? "—"}</td>
                <td style={{ padding: "10px 14px" }}>{t.subscription?.status ?? "SEM ASSINATURA"}</td>
                <td style={{ padding: "10px 14px" }}>{t._count.users}</td>
                <td style={{ padding: "10px 14px" }}>{t._count.leads}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
