type WhatsAppInboundMessage = {
  from: string; id: string; type: string;
  text?: { body: string }; image?: { id: string; caption?: string };
  [key: string]: unknown;
};
type WhatsAppValue = {
  metadata: { phone_number_id: string; display_phone_number?: string };
  contacts?: { profile: { name?: string }; wa_id: string }[];
  messages?: WhatsAppInboundMessage[];
  statuses?: { id: string; status: string; recipient_id: string }[];
};

export function extractMessageBody(msg: WhatsAppInboundMessage): string {
  if (msg.type === "text" && msg.text?.body) return msg.text.body;
  if (msg.type === "image") return msg.image?.caption ?? "[Imagem recebida]";
  return `[Mensagem do tipo ${msg.type} recebida]`;
}
export function extractContactName(value: WhatsAppValue, waId: string): string | undefined {
  return value.contacts?.find((c) => c.wa_id === waId)?.profile?.name;
}
