/**
 * Seed da Fase 0/1 — popula a fundação completa da plataforma:
 * Organization, Tenant, Workspace, AvelonStaff, catálogo de Plan/Module/
 * Feature, Subscription, Permission/RolePermission, TechnicalSource/
 * BusinessChannel/Campaign, e os dados comerciais (users, leads, etc.)
 * já adaptados à nova hierarquia.
 *
 * Nenhuma API/tela é criada aqui — isto só prepara o banco para a
 * validação da Fase 0/1.
 */

import { PrismaClient, PropertyPurpose, LeadStatusKey, AvelonStaffRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // ═══════════════════════════════════════════════════════════════
  // 1) AVELON STAFF (identidade interna, sem tenantId)
  // ═══════════════════════════════════════════════════════════════
  const staffPasswordHash = await bcrypt.hash("avelon123", 10);
  await prisma.avelonStaff.upsert({
    where: { email: "staff@avelon.com" },
    update: { passwordHash: staffPasswordHash },
    create: {
      name: "Equipe Avelon",
      email: "staff@avelon.com",
      passwordHash: staffPasswordHash,
      role: AvelonStaffRole.SUPER_ADMIN,
    },
  });

  // ═══════════════════════════════════════════════════════════════
  // 2) CATÁLOGO: Module → Feature
  // ═══════════════════════════════════════════════════════════════
  const moduleDefs: { key: string; name: string; features: { key: string; name: string }[] }[] = [
    {
      key: "CRM",
      name: "CRM",
      features: [
        { key: "CRM_LEADS", name: "Gestão de Leads" },
        { key: "CRM_KANBAN", name: "Kanban" },
        { key: "CRM_AGENDA", name: "Agenda" },
        { key: "CRM_RELATORIOS", name: "Relatórios" },
        { key: "CRM_WHATSAPP", name: "WhatsApp integrado" },
      ],
    },
    { key: "IA", name: "Inteligência Artificial", features: [{ key: "IA_ASSISTENTE", name: "Assistente IA (reservado)" }] },
    { key: "BI", name: "Business Intelligence", features: [{ key: "BI_DASHBOARDS", name: "Dashboards avançados (reservado)" }] },
    { key: "API_PUBLICA", name: "API Pública", features: [{ key: "API_ACESSO", name: "Acesso à API pública (reservado)" }] },
    { key: "MARKETPLACE", name: "Marketplace", features: [{ key: "MARKETPLACE_ACESSO", name: "Acesso ao Marketplace (reservado)" }] },
    { key: "FINANCEIRO", name: "Financeiro", features: [{ key: "FINANCEIRO_BASE", name: "Módulo Financeiro (reservado)" }] },
    { key: "DOCUMENTOS", name: "Documentos", features: [{ key: "DOCUMENTOS_BASE", name: "Módulo Documentos (reservado)" }] },
    { key: "CONTRATOS", name: "Contratos", features: [{ key: "CONTRATOS_BASE", name: "Módulo Contratos (reservado)" }] },
    { key: "MARKETING", name: "Marketing", features: [{ key: "MARKETING_BASE", name: "Módulo Marketing (reservado)" }] },
  ];

  const featureByKey: Record<string, string> = {};

  for (const m of moduleDefs) {
    const mod = await prisma.module.upsert({
      where: { key: m.key },
      update: { name: m.name },
      create: { key: m.key, name: m.name },
    });

    for (const f of m.features) {
      const feature = await prisma.feature.upsert({
        where: { moduleId_key: { moduleId: mod.id, key: f.key } },
        update: { name: f.name },
        create: { moduleId: mod.id, key: f.key, name: f.name },
      });
      featureByKey[f.key] = feature.id;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 3) CATÁLOGO: Plan → PlanFeature
  // ═══════════════════════════════════════════════════════════════
  const crmFeatures = ["CRM_LEADS", "CRM_KANBAN", "CRM_AGENDA", "CRM_RELATORIOS", "CRM_WHATSAPP"];

  const planDefs: { key: string; name: string; featureKeys: string[] }[] = [
    { key: "STARTER", name: "Starter", featureKeys: crmFeatures },
    { key: "PROFESSIONAL", name: "Professional", featureKeys: [...crmFeatures, "IA_ASSISTENTE"] },
    {
      key: "ENTERPRISE",
      name: "Enterprise",
      featureKeys: [...crmFeatures, "IA_ASSISTENTE", "BI_DASHBOARDS", "API_ACESSO", "MARKETPLACE_ACESSO"],
    },
  ];

  const planByKey: Record<string, string> = {};

  for (const p of planDefs) {
    const plan = await prisma.plan.upsert({
      where: { key: p.key },
      update: { name: p.name },
      create: { key: p.key, name: p.name },
    });
    planByKey[p.key] = plan.id;

    for (const fk of p.featureKeys) {
      await prisma.planFeature.upsert({
        where: { planId_featureId: { planId: plan.id, featureId: featureByKey[fk] } },
        update: {},
        create: { planId: plan.id, featureId: featureByKey[fk] },
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 4) CATÁLOGO: Permission → RolePermission
  // ═══════════════════════════════════════════════════════════════
  const permissionDefs: { key: string; description: string }[] = [
    { key: "leads.view_all", description: "Ver todos os leads do tenant" },
    { key: "leads.view_team", description: "Ver leads da própria equipe" },
    { key: "leads.view_own", description: "Ver apenas os próprios leads" },
    { key: "leads.edit", description: "Editar dados de leads" },
    { key: "leads.distribute", description: "Reatribuir/distribuir leads" },
    { key: "reports.view_global", description: "Ver relatórios de todo o tenant" },
    { key: "reports.view_team", description: "Ver relatórios da própria equipe" },
    { key: "users.manage", description: "Criar e gerenciar usuários" },
    { key: "integrations.view_status", description: "Ver status comercial das integrações" },
    { key: "settings.manage", description: "Gerenciar configurações comerciais do tenant" },
    { key: "tasks.manage_own", description: "Criar/concluir as próprias tarefas" },
    { key: "tasks.manage_team", description: "Gerenciar tarefas da equipe" },
  ];

  const permissionByKey: Record<string, string> = {};

  for (const p of permissionDefs) {
    const permission = await prisma.permission.upsert({
      where: { key: p.key },
      update: { description: p.description },
      create: { key: p.key, description: p.description },
    });
    permissionByKey[p.key] = permission.id;
  }

  const rolePermissionDefs: { role: "OWNER" | "MANAGER" | "CORRECTOR"; permissionKeys: string[] }[] = [
    {
      role: "OWNER",
      permissionKeys: [
        "leads.view_all",
        "leads.edit",
        "leads.distribute",
        "reports.view_global",
        "users.manage",
        "integrations.view_status",
        "settings.manage",
        "tasks.manage_team",
      ],
    },
    {
      role: "MANAGER",
      permissionKeys: [
        "leads.view_team",
        "leads.edit",
        "leads.distribute",
        "reports.view_team",
        "integrations.view_status",
        "tasks.manage_team",
      ],
    },
    {
      role: "CORRECTOR",
      permissionKeys: ["leads.view_own", "leads.edit", "tasks.manage_own"],
    },
  ];

  for (const rp of rolePermissionDefs) {
    for (const pk of rp.permissionKeys) {
      await prisma.rolePermission.upsert({
        where: { role_permissionId: { role: rp.role, permissionId: permissionByKey[pk] } },
        update: {},
        create: { role: rp.role, permissionId: permissionByKey[pk] },
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 5) ORGANIZATION → TENANT → WORKSPACE
  // ═══════════════════════════════════════════════════════════════
  const organization = await prisma.organization.upsert({
    where: { id: "seed-org-1" },
    update: {},
    create: { id: "seed-org-1", name: "Avelon Imóveis (Grupo)" },
  });

  const tenant = await prisma.tenant.upsert({
    where: { id: "seed-tenant-1" },
    update: { organizationId: organization.id },
    create: { id: "seed-tenant-1", organizationId: organization.id, name: "Imobiliária Avelon" },
  });

  const workspace = await prisma.workspace.upsert({
    where: { id: "seed-workspace-1" },
    update: {},
    create: { id: "seed-workspace-1", tenantId: tenant.id, name: "Operação Geral", isDefault: true },
  });

  // ═══════════════════════════════════════════════════════════════
  // 6) SUBSCRIPTION do tenant
  // ═══════════════════════════════════════════════════════════════
  await prisma.subscription.upsert({
    where: { tenantId: tenant.id },
    update: { planId: planByKey["PROFESSIONAL"], status: "ACTIVE" },
    create: { tenantId: tenant.id, planId: planByKey["PROFESSIONAL"], status: "ACTIVE" },
  });

  // ═══════════════════════════════════════════════════════════════
  // 7) USUÁRIOS (papéis já como OWNER/MANAGER/CORRECTOR)
  // ═══════════════════════════════════════════════════════════════
  const ownerPasswordHash = await bcrypt.hash("admin123", 10);
  const owner = await prisma.user.upsert({
    where: { email: "admin@avelon.com" },
    update: { passwordHash: ownerPasswordHash, role: "OWNER", workspaceId: workspace.id },
    create: {
      tenantId: tenant.id,
      workspaceId: workspace.id,
      name: "Admin Avelon",
      email: "admin@avelon.com",
      role: "OWNER",
      passwordHash: ownerPasswordHash,
    },
  });

  const managerPasswordHash = await bcrypt.hash("gerente123", 10);
  const manager = await prisma.user.upsert({
    where: { email: "marta@avelon.com" },
    update: { passwordHash: managerPasswordHash, role: "MANAGER", workspaceId: workspace.id },
    create: {
      tenantId: tenant.id,
      workspaceId: workspace.id,
      name: "Marta Gerente",
      email: "marta@avelon.com",
      role: "MANAGER",
      passwordHash: managerPasswordHash,
    },
  });

  const c1PasswordHash = await bcrypt.hash("corretor123", 10);
  const c1 = await prisma.user.upsert({
    where: { email: "corretor1@avelon.com" },
    update: { passwordHash: c1PasswordHash, role: "CORRECTOR", workspaceId: workspace.id, managerId: manager.id },
    create: {
      tenantId: tenant.id,
      workspaceId: workspace.id,
      managerId: manager.id,
      name: "Corretor 1",
      email: "corretor1@avelon.com",
      phone: "+55 11 99999-1111",
      role: "CORRECTOR",
      passwordHash: c1PasswordHash,
    },
  });

  const c2PasswordHash = await bcrypt.hash("corretor123", 10);
  const c2 = await prisma.user.upsert({
    where: { email: "corretor2@avelon.com" },
    update: { passwordHash: c2PasswordHash, role: "CORRECTOR", workspaceId: workspace.id, managerId: manager.id },
    create: {
      tenantId: tenant.id,
      workspaceId: workspace.id,
      managerId: manager.id,
      name: "Corretor 2",
      email: "corretor2@avelon.com",
      phone: "+55 11 99999-2222",
      role: "CORRECTOR",
      passwordHash: c2PasswordHash,
    },
  });

  // ═══════════════════════════════════════════════════════════════
  // 8) BUSINESS CHANNELS (comercial, visível ao tenant)
  // ═══════════════════════════════════════════════════════════════
  const channelWhatsApp = await prisma.businessChannel.upsert({
    where: { tenantId_type: { tenantId: tenant.id, type: "WHATSAPP" } },
    update: {},
    create: { tenantId: tenant.id, type: "WHATSAPP", displayLabel: "WhatsApp" },
  });

  const channelFacebook = await prisma.businessChannel.upsert({
    where: { tenantId_type: { tenantId: tenant.id, type: "FACEBOOK" } },
    update: {},
    create: { tenantId: tenant.id, type: "FACEBOOK", displayLabel: "Facebook" },
  });

  const channelSite = await prisma.businessChannel.upsert({
    where: { tenantId_type: { tenantId: tenant.id, type: "SITE" } },
    update: {},
    create: { tenantId: tenant.id, type: "SITE", displayLabel: "Site" },
  });

  await prisma.businessChannel.upsert({
    where: { tenantId_type: { tenantId: tenant.id, type: "MANUAL" } },
    update: {},
    create: { tenantId: tenant.id, type: "MANUAL", displayLabel: "Manual" },
  });

  // ═══════════════════════════════════════════════════════════════
  // 9) CAMPAIGNS (comercial, dentro de um canal)
  // ═══════════════════════════════════════════════════════════════
  const campaignRiviera = await prisma.campaign.upsert({
    where: { id: "seed-campaign-riviera" },
    update: { businessChannelId: channelSite.id, name: "Landing Page Riviera" },
    create: {
      id: "seed-campaign-riviera",
      tenantId: tenant.id,
      businessChannelId: channelSite.id,
      name: "Landing Page Riviera",
    },
  });

  const campaignAltoPadrao = await prisma.campaign.upsert({
    where: { id: "seed-campaign-alto-padrao" },
    update: { businessChannelId: channelFacebook.id, name: "Campanha Alto Padrão - Julho" },
    create: {
      id: "seed-campaign-alto-padrao",
      tenantId: tenant.id,
      businessChannelId: channelFacebook.id,
      name: "Campanha Alto Padrão - Julho",
    },
  });

  // ═══════════════════════════════════════════════════════════════
  // 10) TECHNICAL SOURCES (interno, só Avelon vê) + mapeamento
  // ═══════════════════════════════════════════════════════════════
  const tsTypebot = await prisma.technicalSource.upsert({
    where: { tenantId_kind: { tenantId: tenant.id, kind: "TYPEBOT_IMOVEIS" } },
    update: { businessChannelId: channelSite.id },
    create: {
      tenantId: tenant.id,
      kind: "TYPEBOT_IMOVEIS",
      label: "Typebot - Site Imóveis",
      businessChannelId: channelSite.id,
    },
  });

  const tsMake = await prisma.technicalSource.upsert({
    where: { tenantId_kind: { tenantId: tenant.id, kind: "MAKE_SITE" } },
    update: { businessChannelId: channelSite.id },
    create: {
      tenantId: tenant.id,
      kind: "MAKE_SITE",
      label: "Make - Automação Site",
      businessChannelId: channelSite.id,
    },
  });

  const tsFacebook = await prisma.technicalSource.upsert({
    where: { tenantId_kind: { tenantId: tenant.id, kind: "FACEBOOK_LEADS" } },
    update: { businessChannelId: channelFacebook.id },
    create: {
      tenantId: tenant.id,
      kind: "FACEBOOK_LEADS",
      label: "Facebook Lead Ads (Graph API)",
      businessChannelId: channelFacebook.id,
    },
  });

  const tsWhatsApp = await prisma.technicalSource.upsert({
    where: { tenantId_kind: { tenantId: tenant.id, kind: "WHATSAPP" } },
    update: { businessChannelId: channelWhatsApp.id },
    create: {
      tenantId: tenant.id,
      kind: "WHATSAPP",
      label: "WhatsApp Cloud API",
      businessChannelId: channelWhatsApp.id,
    },
  });

  // Webhooks técnicos (Typebot/Make) — secret nunca exposto ao tenant
  // upsert por id fixo é suficiente e seguro; nenhum fallback é necessário
  await prisma.integrationWebhook.upsert({
    where: { id: "seed-webhook-typebot" },
    update: { enabled: true, technicalSourceId: tsTypebot.id },
    create: {
      id: "seed-webhook-typebot",
      tenantId: tenant.id,
      technicalSourceId: tsTypebot.id,
      secret: "CHANGE_ME_TYPEBOT_SECRET",
      enabled: true,
    },
  });

  await prisma.integrationWebhook.upsert({
    where: { id: "seed-webhook-make" },
    update: { enabled: true, technicalSourceId: tsMake.id },
    create: {
      id: "seed-webhook-make",
      tenantId: tenant.id,
      technicalSourceId: tsMake.id,
      secret: "CHANGE_ME_MAKE_SECRET",
      enabled: true,
    },
  });

  // ═══════════════════════════════════════════════════════════════
  // 11) LEADS (com as 3 camadas de origem já preenchidas)
  // ═══════════════════════════════════════════════════════════════
  const leadWon = await prisma.lead.upsert({
    where: { id: "seed-lead-joao-silva" },
    update: {
      technicalSourceId: tsFacebook.id,
      businessChannelId: channelFacebook.id,
      campaignId: campaignAltoPadrao.id,
      assignedToUserId: c1.id,
    },
    create: {
      id: "seed-lead-joao-silva",
      tenantId: tenant.id,
      workspaceId: workspace.id,
      name: "João da Silva",
      phone: "+55 11 98888-0001",
      email: "joao@exemplo.com",
      city: "São Paulo",
      neighborhood: "Moema",
      propertyPurpose: PropertyPurpose.SALE,
      propertyType: "Apartamento",
      desiredValue: 650000,
      technicalSourceId: tsFacebook.id,
      businessChannelId: channelFacebook.id,
      campaignId: campaignAltoPadrao.id,
      statusKey: LeadStatusKey.WON,
      observations: "Fechou contrato — cliente satisfeito, pediu indicação de mobiliadora.",
      enteredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20),
      assignedToUserId: c1.id,
    },
  });

  const wonFlow: { id: string; status: LeadStatusKey; daysAgo: number; note: string }[] = [
    { id: "seed-mov-joao-1", status: LeadStatusKey.FIRST_CONTACT, daysAgo: 19, note: "Primeiro contato feito por telefone" },
    { id: "seed-mov-joao-2", status: LeadStatusKey.IN_PROGRESS, daysAgo: 17, note: "Qualificação de perfil" },
    { id: "seed-mov-joao-3", status: LeadStatusKey.SCHEDULED_VISIT, daysAgo: 14, note: "Visita agendada" },
    { id: "seed-mov-joao-4", status: LeadStatusKey.VISITED, daysAgo: 12, note: "Visita realizada, cliente gostou" },
    { id: "seed-mov-joao-5", status: LeadStatusKey.PROPOSAL, daysAgo: 9, note: "Proposta enviada" },
    { id: "seed-mov-joao-6", status: LeadStatusKey.NEGOTIATION, daysAgo: 6, note: "Negociação de valor" },
    { id: "seed-mov-joao-7", status: LeadStatusKey.CONTRACT, daysAgo: 3, note: "Contrato em elaboração" },
    { id: "seed-mov-joao-8", status: LeadStatusKey.WON, daysAgo: 0, note: "Contrato assinado" },
  ];

  let prevStatus: LeadStatusKey = "NEW" as LeadStatusKey;
  for (const step of wonFlow) {
    await prisma.leadMovement.upsert({
      where: { id: step.id },
      update: {},
      create: {
        id: step.id,
        tenantId: tenant.id,
        leadId: leadWon.id,
        fromStatus: prevStatus,
        toStatus: step.status,
        changedByUserId: c1.id,
        note: step.note,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * step.daysAgo),
      },
    });
    prevStatus = step.status;
  }

  await prisma.leadTask.upsert({
    where: { id: "seed-task-joao-contrato" },
    update: {},
    create: {
      id: "seed-task-joao-contrato",
      tenantId: tenant.id,
      leadId: leadWon.id,
      title: "Enviar contrato para assinatura",
      dueAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
      completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
      completedByUserId: c1.id,
      assignedToUserId: c1.id,
    },
  });

  await prisma.leadTask.upsert({
    where: { id: "seed-task-joao-followup" },
    update: {},
    create: {
      id: "seed-task-joao-followup",
      tenantId: tenant.id,
      leadId: leadWon.id,
      title: "Follow-up pós-venda",
      dueAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5),
      assignedToUserId: c1.id,
    },
  });

  const leadLost = await prisma.lead.upsert({
    where: { id: "seed-lead-carlos-pereira" },
    update: {
      technicalSourceId: tsWhatsApp.id,
      businessChannelId: channelWhatsApp.id,
      assignedToUserId: c2.id,
    },
    create: {
      id: "seed-lead-carlos-pereira",
      tenantId: tenant.id,
      workspaceId: workspace.id,
      name: "Carlos Pereira",
      phone: "5511988880003",
      email: "carlos@exemplo.com",
      city: "São Paulo",
      neighborhood: "Pinheiros",
      propertyPurpose: PropertyPurpose.RENT,
      propertyType: "Studio",
      desiredValue: 3200,
      technicalSourceId: tsWhatsApp.id,
      businessChannelId: channelWhatsApp.id,
      statusKey: LeadStatusKey.LOST,
      observations: "Desistiu — encontrou outro imóvel",
      enteredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
      assignedToUserId: c2.id,
    },
  });

  await prisma.leadTask.upsert({
    where: { id: "seed-task-carlos-reagendar" },
    update: {},
    create: {
      id: "seed-task-carlos-reagendar",
      tenantId: tenant.id,
      leadId: leadLost.id,
      title: "Ligar para reagendar visita",
      dueAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
      assignedToUserId: c2.id,
    },
  });

  await prisma.lead.upsert({
    where: { id: "seed-lead-maria-souza" },
    update: {
      technicalSourceId: tsFacebook.id,
      businessChannelId: channelFacebook.id,
    },
    create: {
      id: "seed-lead-maria-souza",
      tenantId: tenant.id,
      workspaceId: workspace.id,
      name: "Maria Souza",
      phone: "+55 11 98888-0002",
      email: "maria@exemplo.com",
      city: "São Paulo",
      neighborhood: "Tatuapé",
      propertyPurpose: PropertyPurpose.RENT,
      propertyType: "Casa",
      desiredValue: 3800,
      technicalSourceId: tsFacebook.id,
      businessChannelId: channelFacebook.id,
      statusKey: LeadStatusKey.NEW,
      observations: "Lead recém-chegado",
      enteredAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
    },
  });

  // referência à campanha Riviera para não ficar órfã no seed
  console.log(`  (Campanha "${campaignRiviera.name}" criada e disponível para uso futuro)`);

  console.log("✅ Seed da Fase 0/1 concluído.");
  console.log("— Login Avelon Staff: staff@avelon.com / avelon123");
  console.log("— Login Owner (tenant): admin@avelon.com / admin123");
  console.log("— Login Manager: marta@avelon.com / gerente123");
  console.log("— Login Corretor: corretor1@avelon.com / corretor123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
