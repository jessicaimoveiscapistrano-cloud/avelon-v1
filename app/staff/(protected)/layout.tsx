// app/staff/layout.tsx  (ATUALIZADO — Fase 7 adicionou telas que nunca
// foram linkadas na navegação; corrigido aqui)

import Link from "next/link";
import { requireStaffUser } from "@/server/auth/staffSession";
import { StaffLogoutButton } from "@/components/staff/StaffLogoutButton";

const STAFF_NAV = [
  { href: "/staff", label: "Início" },
  { href: "/staff/tenants", label: "Tenants" },
  { href: "/staff/audit-logs", label: "Auditoria" },
];

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireStaffUser();

  return (
    <div style={{ minHeight: "100vh", background: "#f6f5f2" }}>
      <div
        style={{
          height: 56,
          background: "#111a33",
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
          gap: 16,
        }}
      >
        <div style={{ color: "#f5f3ec", fontWeight: 700, fontSize: 14 }}>Avelon Platform</div>
        <div style={{ color: "#8b91ab", fontSize: 12 }}>Painel interno</div>

        <nav style={{ display: "flex", gap: 4, marginLeft: 24 }}>
          {STAFF_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                color: "#c7cbe0",
                fontSize: 13,
                fontWeight: 500,
                padding: "6px 10px",
                borderRadius: 8,
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: "#c7cbe0", fontSize: 13 }}>
            {staff.name} · {staff.role}
          </span>
          <StaffLogoutButton />
        </div>
      </div>
      <main style={{ padding: 28 }}>{children}</main>
    </div>
  );
}
