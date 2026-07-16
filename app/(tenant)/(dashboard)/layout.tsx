import Link from "next/link";
import { requireTenantUser } from "@/server/auth/requireTenant";
import { hasAnyCrmFeature } from "@/server/services/access/features";

export const dynamic = "force-dynamic";

const NAV_GROUPS = [
  {
    label: "VISÃO GERAL",
    items: [{ href: "/dashboard", label: "Dashboard", icon: "grid" }],
  },
  {
    label: "VENDAS",
    items: [
      { href: "/leads", label: "Leads", icon: "users" },
      { href: "/kanban", label: "Kanban", icon: "columns" },
      { href: "/agenda", label: "Agenda", icon: "calendar" },
      { href: "/relatorios", label: "Relatórios", icon: "chart" },
    ],
  },
  {
    label: "ADMINISTRAÇÃO",
    items: [
      { href: "/usuarios", label: "Usuários", icon: "user" },
      { href: "/integracoes", label: "Integrações", icon: "plug" },
    ],
  },
];

function Icon({ name }: { name: string }) {
  const common = { width: 17, height: 17, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8 };
  switch (name) {
    case "grid":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="9" rx="1.5" />
          <rect x="14" y="3" width="7" height="5" rx="1.5" />
          <rect x="14" y="12" width="7" height="9" rx="1.5" />
          <rect x="3" y="16" width="7" height="5" rx="1.5" />
        </svg>
      );
    case "users":
      return (
        <svg {...common}>
          <circle cx="9" cy="7" r="3.2" />
          <path d="M2.5 20c0-3.6 2.9-6.2 6.5-6.2s6.5 2.6 6.5 6.2" />
          <circle cx="17.5" cy="8" r="2.6" />
          <path d="M15 13.5c2.9.4 5 2.7 5 6.5" />
        </svg>
      );
    case "columns":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="5" height="16" rx="1.2" />
          <rect x="9.5" y="4" width="5" height="10" rx="1.2" />
          <rect x="16" y="4" width="5" height="13" rx="1.2" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18M8 3v4M16 3v4" />
        </svg>
      );
    case "chart":
      return (
        <svg {...common}>
          <path d="M4 20V10M12 20V4M20 20v-7" />
        </svg>
      );
    case "user":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.4" />
          <path d="M4.5 20c0-4.1 3.3-7 7.5-7s7.5 2.9 7.5 7" />
        </svg>
      );
    case "plug":
      return (
        <svg {...common}>
          <path d="M9 3v4M15 3v4M9 17v4M15 17v4M5 9h4M5 15h4M15 9h4M15 15h4" />
          <rect x="9" y="9" width="6" height="6" rx="1.3" />
        </svg>
      );
    default:
      return null;
  }
}

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

  const initials = user.name.split(" ").map((p: string) => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "#f6f5f2" }}>
      <aside
        style={{
          width: 236,
          flex: "none",
          background: "linear-gradient(180deg, #111a33 0%, #0d1326 100%)",
          color: "#e7e9f2",
          padding: "20px 14px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "4px 6px 22px" }}>
          <div
            style={{
              width: 28, height: 28, borderRadius: 8,
              background: "linear-gradient(135deg, #b8923f, #8a6a26)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "Georgia, serif", fontWeight: 700, color: "#241b06", fontSize: 14,
            }}
          >
            A
          </div>
          <div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 15, fontWeight: 700, color: "#f5f3ec", lineHeight: 1.1 }}>
              Avelon CRM
            </div>
            <div style={{ fontSize: 10, letterSpacing: "0.06em", color: "#8b91ab", textTransform: "uppercase" }}>
              Imobiliária Avelon
            </div>
          </div>
        </div>

        {NAV_GROUPS.map((group) => (
          <div key={group.label} style={{ marginBottom: 6 }}>
            <div style={{ fontSize: 10.5, letterSpacing: "0.08em", color: "#767ea0", margin: "14px 8px 6px" }}>
              {group.label}
            </div>
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 10px", borderRadius: 9, fontSize: 13.5,
                  color: "#c7cbe0", fontWeight: 500, textDecoration: "none",
                }}
              >
                <Icon name={item.icon} />
                {item.label}
              </Link>
            ))}
          </div>
        ))}

        <div style={{ marginTop: "auto", paddingTop: 14, borderTop: "1px solid rgba(255,255,255,.08)", display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32, height: 32, borderRadius: "50%", background: "#b8923f", color: "#241b06",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12.5, fontWeight: 700, flex: "none",
            }}
          >
            {initials}
          </div>
          <div>
            <div style={{ fontSize: 12.5, color: "#f1f2f8" }}>{user.name}</div>
            <div style={{ fontSize: 11, color: "#8b91ab" }}>{user.role}</div>
          </div>
        </div>
      </aside>

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <div
          style={{
            height: 64, flex: "none", background: "#fff", borderBottom: "1px solid #e5e2d9",
            display: "flex", alignItems: "center", gap: 16, padding: "0 28px",
          }}
        >
          <div
            style={{
              flex: 1, maxWidth: 420, display: "flex", alignItems: "center", gap: 8,
              background: "#f6f5f2", border: "1px solid #e5e2d9", borderRadius: 10,
              padding: "9px 12px", color: "#9498a3",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
            <span style={{ fontSize: 13.5 }}>Buscar leads, usuários...</span>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 36, height: 36, borderRadius: 9, border: "1px solid #e5e2d9", background: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280", position: "relative",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.7 21a2 2 0 01-3.4 0" />
              </svg>
              <span style={{ position: "absolute", top: 7, right: 7, width: 7, height: 7, borderRadius: "50%", background: "#c2483f", border: "1.5px solid #fff" }} />
            </div>
            <div
              style={{
                width: 34, height: 34, borderRadius: "50%", background: "#111a33", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12.5, fontWeight: 700,
              }}
            >
              {initials}
            </div>
          </div>
        </div>

        <main style={{ flex: 1, minWidth: 0 }}>{children}</main>
      </div>
    </div>
  );
}
