// server/services/access/permissions.ts
//
// Ponto único de checagem de permissão. Nenhuma rota deve comparar
// `user.role === "OWNER"` diretamente — sempre via hasPermission, para que
// adicionar um papel novo em V2 seja só inserir linhas em RolePermission,
// sem tocar em nenhuma rota já escrita (ver ENGINEERING_GUIDE.md).

import { prisma } from "@/server/prisma/client";
import { UserRole } from "@prisma/client";

// cache simples em memória do processo — o catálogo de permissões é
// praticamente estático (só muda quando alguém edita RolePermission via
// seed/admin), então recarregar a cada request seria custo desnecessário.
// TTL curto o suficiente para refletir mudanças sem exigir redeploy.
let cache: { data: Record<string, Set<string>>; expiresAt: number } | null = null;
const CACHE_TTL_MS = 60_000;

async function loadRolePermissions(): Promise<Record<string, Set<string>>> {
  if (cache && cache.expiresAt > Date.now()) return cache.data;

  const rows = await prisma.rolePermission.findMany({
    include: { permission: { select: { key: true } } },
  });

  const data: Record<string, Set<string>> = {};
  for (const row of rows) {
    if (!data[row.role]) data[row.role] = new Set();
    data[row.role].add(row.permission.key);
  }

  cache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
  return data;
}

export async function hasPermission(role: UserRole, permissionKey: string): Promise<boolean> {
  const table = await loadRolePermissions();
  return table[role]?.has(permissionKey) ?? false;
}

// útil quando a rota precisa checar e responder 403 de forma padronizada
export async function assertPermission(role: UserRole, permissionKey: string): Promise<boolean> {
  return hasPermission(role, permissionKey);
}
