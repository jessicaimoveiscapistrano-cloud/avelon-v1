// app/staff/audit-logs/page.tsx

import { prisma } from "@/server/prisma/client";
import { requireStaffUser } from "@/server/auth/staffSession";
export const dynamic = "force-dynamic";

export default async function StaffAuditLogsPage() {
  await requireStaffUser();

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      staff: { select: { name: true } },
      tenant: { select: { name: true } },
    },
  });

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Auditoria</h1>
      <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 20 }}>
        Últimas {logs.length} ações registradas
      </p>

      <div style={{ background: "#fff", border: "1px solid #e5e2d9", borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", background: "#faf9f5", color: "#6b7280" }}>
              <th style={{ padding: "10px 14px" }}>Quando</th>
              <th style={{ padding: "10px 14px" }}>Staff</th>
              <th style={{ padding: "10px 14px" }}>Tenant</th>
              <th style={{ padding: "10px 14px" }}>Ação</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} style={{ borderTop: "1px solid #f0efe9" }}>
                <td style={{ padding: "10px 14px", color: "#6b7280" }}>
                  {log.createdAt.toLocaleString("pt-BR")}
                </td>
                <td style={{ padding: "10px 14px", fontWeight: 600 }}>{log.staff?.name ?? "—"}</td>
                <td style={{ padding: "10px 14px" }}>{log.tenant?.name ?? "—"}</td>
                <td style={{ padding: "10px 14px", fontFamily: "monospace", fontSize: 12 }}>
                  {log.action}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: 20, textAlign: "center", color: "#9498a3" }}>
                  Nenhuma acao registrada ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
