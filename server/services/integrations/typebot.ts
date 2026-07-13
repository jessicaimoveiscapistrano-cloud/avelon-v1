import { normalizePurpose } from "./normalize";

type TypebotAnswer = { variableId?: string; value?: string };
type TypebotPayload = { resultId?: string; answers?: TypebotAnswer[]; [key: string]: unknown };

const FIELD_ALIASES: Record<string, string[]> = {
  name: ["nome", "name", "nome_completo", "fullname"],
  phone: ["telefone", "phone", "whatsapp", "celular", "numero"],
  email: ["email", "e-mail", "mail"],
  city: ["cidade", "city"],
  neighborhood: ["bairro", "neighborhood"],
  propertyPurpose: ["finalidade", "purpose", "objetivo", "tipo_negocio"],
  propertyType: ["tipo_imovel", "propertyType", "tipo"],
  desiredValue: ["valor", "valor_desejado", "orcamento", "budget", "desiredValue"],
  observations: ["observacoes", "obs", "mensagem", "message"],
};

function findValue(map: Record<string, string>, aliases: string[]): string | undefined {
  for (const alias of aliases) {
    const key = Object.keys(map).find((k) => k.toLowerCase() === alias.toLowerCase());
    if (key && map[key]) return map[key];
  }
  return undefined;
}
function onlyDigits(v: string) { return v.replace(/\D/g, ""); }

export function normalizeTypebotPayload(payload: TypebotPayload) {
  const flatMap: Record<string, string> = {};
  if (Array.isArray(payload.answers)) {
    for (const a of payload.answers) if (a.variableId && a.value !== undefined) flatMap[a.variableId] = String(a.value);
  }
  for (const [k, v] of Object.entries(payload)) {
    if (k === "answers" || k === "resultId") continue;
    if (typeof v === "string" || typeof v === "number") flatMap[k] = String(v);
  }

  const name = findValue(flatMap, FIELD_ALIASES.name);
  const phoneRaw = findValue(flatMap, FIELD_ALIASES.phone);
  if (!name || !phoneRaw) return { ok: false as const, error: "Payload do Typebot sem nome ou telefone identificável" };

  const desiredValueRaw = findValue(flatMap, FIELD_ALIASES.desiredValue);
  const desiredValue = desiredValueRaw ? Number(onlyDigits(desiredValueRaw)) : undefined;

  return {
    ok: true as const,
    data: {
      name, phone: onlyDigits(phoneRaw),
      email: findValue(flatMap, FIELD_ALIASES.email),
      city: findValue(flatMap, FIELD_ALIASES.city) ?? "Não informado",
      neighborhood: findValue(flatMap, FIELD_ALIASES.neighborhood),
      propertyPurpose: normalizePurpose(findValue(flatMap, FIELD_ALIASES.propertyPurpose)) ?? "SALE",
      propertyType: findValue(flatMap, FIELD_ALIASES.propertyType),
      desiredValue: Number.isFinite(desiredValue) ? desiredValue : undefined,
      observations: `Lead via Typebot (resultId: ${payload.resultId ?? "N/A"})`,
    },
  };
}
