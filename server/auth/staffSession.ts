// server/auth/staffSession.ts
//
// Espelha o padrão já usado no lado tenant (session.ts / requireTenant.ts /
// apiAuth.ts), mas para a identidade de staff. Nunca deve ser importado por
// código do lado comercial (app/(dashboard)/**, app/api/** fora de /admin).
//
// Fase 2 — preparado, ainda não consumido por nenhuma rota real.

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { staffAuthOptions } from "./staffAuthOptions";

export async function getSessionStaff() {
  const session = await getServerSession(staffAuthOptions);
  if (!session?.user) return null;

  const u = session.user as any;
  return {
    id: u.staffId as string,
    role: u.staffRole as "SUPER_ADMIN" | "SUPPORT" | "ENGINEER" | "FINANCE",
    name: u.name as string,
    email: u.email as string,
  };
}

// Uso: Server Components / Pages sob app/staff/**
export async function requireStaffUser() {
  const staff = await getSessionStaff();
  if (!staff) redirect("/staff/login");
  return staff;
}

// Uso: API Routes sob app/api/admin/**
type ApiStaffAuthResult =
  | { staff: NonNullable<Awaited<ReturnType<typeof getSessionStaff>>>; response: null }
  | { staff: null; response: NextResponse };

export async function requireApiStaff(): Promise<ApiStaffAuthResult> {
  const staff = await getSessionStaff();
  if (!staff) {
    return { staff: null, response: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) };
  }
  return { staff, response: null };
}
