// app/api/users/route.ts  (CORRIGE 2 resíduos pré-Fase 0/1 + pré-Fase 5)
//
// BUG 1: usava `requireTenantUser()` — helper que faz `redirect()` do
// next/navigation, válido só em Server Components/Pages. Dentro de uma
// API Route isso é o helper errado (deveria ser requireApiUser desde a
// "revisão técnica final" da V1 — este arquivo escapou daquela auditoria).
//
// BUG 2: `requester.role !== "ADMIN"` — papel renomeado para OWNER na
// Fase 0/1, e além disso é comparação direta de role, prática que o
// ENGINEERING_GUIDE.md pede para evitar desde a Fase 5. Substituído por
// hasPermission(role, "users.manage").

import { NextResponse } from "next/server";
import { prisma } from "@/server/prisma/client";
import { requireApiUser } from "@/server/auth/apiAuth"; // ✅ era requireTenantUser
import { hasPermission } from "@/server/services/access/permissions";
import bcrypt from "bcryptjs";

export async function GET() {
  const { user, response } = await requireApiUser();
  if (!user) return response;

  const users = await prisma.user.findMany({
    where: { tenantId: user.tenantId },
    select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const { user: requester, response } = await requireApiUser();
  if (!requester) return response;

  if (!(await hasPermission(requester.role, "users.manage"))) {
    return NextResponse.json({ message: "Sem permissão" }, { status: 403 });
  }

  const body = await req.json();
  const { name, email, phone, role, password } = body;

  if (!name || !email || !password) {
    return NextResponse.json({ message: "Campos obrigatórios faltando" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ message: "E-mail já cadastrado" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const defaultWorkspace = await prisma.workspace.findFirst({
    where: { tenantId: requester.tenantId, isDefault: true },
  });
  if (!defaultWorkspace) {
    return NextResponse.json({ message: "Tenant sem workspace padrão" }, { status: 500 });
  }

  const created = await prisma.user.create({
    data: {
      tenantId: requester.tenantId,
      workspaceId: defaultWorkspace.id,
      name,
      email,
      phone,
      role: role ?? "CORRECTOR",
      passwordHash,
    },
    select: { id: true, name: true, email: true, role: true },
  });

  return NextResponse.json(created, { status: 201 });
}
