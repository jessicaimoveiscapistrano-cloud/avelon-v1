import { prisma } from "@/server/prisma/client";

function onlyDigits(v: string) { return v.replace(/\D/g, ""); }

export async function findLeadByPhone(tenantId: string, phone: string) {
  const digits = onlyDigits(phone);
  const suffix = digits.slice(-9);
  const candidates = await prisma.lead.findMany({
    where: { tenantId, phone: { contains: suffix } },
    orderBy: { enteredAt: "desc" },
    take: 1,
  });
  return candidates[0] ?? null;
}
