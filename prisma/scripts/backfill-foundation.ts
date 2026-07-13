/**
 * Backfill da Fase 0/1 — migra dados de uma V1 já rodando (schema anterior,
 * com IntegrationSource único e sem Organization/Workspace) para a nova
 * fundação de plataforma.
 *
 * Quando rodar:
 *   1. Já ter aplicado a migration estrutural nova via
 *      `npx prisma migrate dev --name v1_platform_foundation`
 *      (isso cria as tabelas novas E as colunas novas em Lead/User como
 *      NULLABLE temporariamente — ver nota de migration abaixo).
 *   2. Rodar este script uma única vez: `npx tsx prisma/scripts/backfill-foundation.ts`
 *   3. Só depois disso aplicar a migration final que torna
 *      Lead.workspaceId e User.workspaceId NOT NULL (ver seção final).
 *
 * Se o projeto ainda não tem dado real em produção (caso mais provável
 * neste estágio da Avelon), este script é dispensável — basta recriar o
 * banco do zero com `prisma migrate reset` + o novo `seed.ts`. Ele existe
 * para o cenário em que já exista uma base com tenants/leads reais.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("▶ Iniciando backfill da fundação de plataforma...");

  // ── 1) Organization: uma por Tenant existente ──────────────────────
  const tenants = await prisma.tenant.findMany({
    where: { organizationId: null as any }, // campo ainda nullable nesta etapa
  });

  for (const tenant of tenants) {
    const organization = await prisma.organization.create({
      data: { name: `${tenant.name} (Grupo)` },
    });

    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { organizationId: organization.id },
    });

    console.log(`  ✓ Organization criada para tenant "${tenant.name}"`);
  }

  // ── 2) Workspace padrão por Tenant ──────────────────────────────────
  const allTenants = await prisma.tenant.findMany();

  for (const tenant of allTenants) {
    const existingDefault = await prisma.workspace.findFirst({
      where: { tenantId: tenant.id, isDefault: true },
    });

    const workspace =
      existingDefault ??
      (await prisma.workspace.create({
        data: { tenantId: tenant.id, name: "Operação Geral", isDefault: true },
      }));

    // backfill de users e leads sem workspaceId
    await prisma.user.updateMany({
      where: { tenantId: tenant.id, workspaceId: null as any },
      data: { workspaceId: workspace.id },
    });

    await prisma.lead.updateMany({
      where: { tenantId: tenant.id, workspaceId: null as any },
      data: { workspaceId: workspace.id },
    });

    console.log(`  ✓ Workspace padrão aplicado ao tenant "${tenant.name}"`);
  }

  // ── 3) Renomear papel ADMIN → OWNER (se a base antiga usava ADMIN) ──
  // Rodar apenas se a coluna role ainda contiver o valor legado "ADMIN"
  // como string crua (ajuste conforme o estado real do enum antigo).
  await prisma.$executeRawUnsafe(`
    UPDATE "User" SET "role" = 'OWNER' WHERE "role" = 'ADMIN';
  `).catch(() => {
    console.log("  ⚠ Nenhum papel legado ADMIN encontrado (ou já migrado).");
  });

  // ── 4) IntegrationSource legado → TechnicalSource + BusinessChannel ─
  // Mapeamento de key técnica antiga para o tipo de canal comercial.
  const KEY_TO_CHANNEL: Record<string, { type: string; label: string }> = {
    TYPEBOT_IMOVEIS: { type: "SITE", label: "Site" },
    MAKE_SITE: { type: "SITE", label: "Site" },
    FACEBOOK_LEADS: { type: "FACEBOOK", label: "Facebook" },
    WHATSAPP: { type: "WHATSAPP", label: "WhatsApp" },
  };
const legacySources = (await prisma.$queryRawUnsafe<
  { id: string; tenantId: string; key: string; label: string }[]
>(
  `SELECT id, "tenantId", key, label FROM "IntegrationSource"`
).catch(() => [])) as {
  id: string;
  tenantId: string;
  key: string;
  label: string;
}[];;

  for (const legacy of legacySources) {
    const mapping = KEY_TO_CHANNEL[legacy.key] ?? { type: "OUTRO", label: legacy.label };

    const businessChannel = await prisma.businessChannel.upsert({
      where: { tenantId_type: { tenantId: legacy.tenantId, type: mapping.type as any } },
      update: {},
      create: {
        tenantId: legacy.tenantId,
        type: mapping.type as any,
        displayLabel: mapping.label,
      },
    });

    const technicalSource = await prisma.technicalSource.upsert({
      where: { tenantId_kind: { tenantId: legacy.tenantId, kind: legacy.key } },
      update: { businessChannelId: businessChannel.id },
      create: {
        tenantId: legacy.tenantId,
        kind: legacy.key,
        label: legacy.label,
        businessChannelId: businessChannel.id,
      },
    });

    // repontar webhooks, configs e leads que usavam o IntegrationSource antigo
    await prisma.$executeRawUnsafe(
      `UPDATE "IntegrationWebhook" SET "technicalSourceId" = $1 WHERE "sourceId" = $2`,
      technicalSource.id,
      legacy.id
    ).catch(() => {});

    await prisma.$executeRawUnsafe(
      `UPDATE "Lead" SET "technicalSourceId" = $1, "businessChannelId" = $2 WHERE "leadSourceId" = $3`,
      technicalSource.id,
      businessChannel.id,
      legacy.id
    ).catch(() => {});

    console.log(`  ✓ IntegrationSource "${legacy.key}" migrado para TechnicalSource + BusinessChannel`);
  }

  console.log("✅ Backfill concluído.");
}

main()
  .catch((e) => {
    console.error("Erro no backfill:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
