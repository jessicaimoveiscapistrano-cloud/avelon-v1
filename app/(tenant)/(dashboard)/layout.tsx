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
  { href: "/integracoes", label: "Integrações" },
];

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireTenantUser();

  const crmActive = await hasAnyCrmFeature(user.tenantId);

  if (!crmActive) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f6f5f2", padding: 32 }}>
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Módulo CRM indisponível</h1>
          <p style={{ fontSize: 14, color: "#6b7280" }}>
            Sua assinatura não está ativa no momento. Entre em contato com seu consultor Avelon.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "#f6f5f2" }}>
      <aside
        style={{
          width: 236,
          background: "linear-gradient(180deg, #111a33 0%, #0d1326 100%)",
          color: "#e7e9f2",
          padding: "20px 14px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "4px 6px 20px" }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "linear-gradient(135deg, #b8923f, #8a6a26)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "Georgia, serif",
              fontWeight: 700,
              color: "#241b06",
              fontSize: 14,
            }}
          >
            A
          </div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 15.5, fontWeight: 700, color: "#f5f3ec" }}>
            Avelon CRM
          </div>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "block",
                padding: "9px 10px",
                borderRadius: 9,
                fontSize: 13,
                color: "#c7cbe0",
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div style={{ marginTop: "auto", paddingTop: 14, borderTop: "1px solid rgba(255,255,255,.08)" }}>
          <div style={{ fontSize: 12.5, color: "#f1f2f8" }}>{user.name}</div>
          <div style={{ fontSize: 11, color: "#8b91ab" }}>{user.role}</div>
        </div>
      </aside>

      <main style={{ flex: 1, minWidth: 0 }}>{children}</main>
    </div>
  );
}
