type FacebookFieldData = { name: string; values: string[] };

const FIELD_ALIASES: Record<string, string[]> = {
  name: ["full_name", "nome", "name", "nome_completo"],
  phone: ["phone_number", "telefone", "phone", "whatsapp"],
  email: ["email", "e-mail"],
  city: ["city", "cidade"],
  neighborhood: ["neighborhood", "bairro"],
};

function findValue(fieldData: FacebookFieldData[], aliases: string[]): string | undefined {
  for (const alias of aliases) {
    const field = fieldData.find((f) => f.name.toLowerCase() === alias.toLowerCase());
    if (field?.values?.[0]) return field.values[0];
  }
  return undefined;
}
function onlyDigits(v: string) { return v.replace(/\D/g, ""); }

export function normalizeFacebookLead(fieldData: FacebookFieldData[], formId: string, leadgenId: string) {
  const name = findValue(fieldData, FIELD_ALIASES.name);
  const phoneRaw = findValue(fieldData, FIELD_ALIASES.phone);
  if (!name || !phoneRaw) return { ok: false as const, error: "Lead do Facebook sem nome ou telefone" };

  return {
    ok: true as const,
    data: {
      name, phone: onlyDigits(phoneRaw),
      email: findValue(fieldData, FIELD_ALIASES.email),
      city: findValue(fieldData, FIELD_ALIASES.city) ?? "Não informado",
      neighborhood: findValue(fieldData, FIELD_ALIASES.neighborhood),
      propertyPurpose: "SALE" as const,
      observations: `Lead via Facebook Lead Ads (form: ${formId}, leadgen_id: ${leadgenId})`,
    },
  };
}
