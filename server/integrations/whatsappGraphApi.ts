type SendMessageResult = { ok: true; waMessageId: string } | { ok: false; error: string };

export async function sendWhatsAppTextMessage(
  phoneNumberId: string, accessToken: string, toNumber: string, body: string
): Promise<SendMessageResult> {
  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ messaging_product: "whatsapp", to: toNumber, type: "text", text: { body } }),
  });
  const data = await res.json();
  if (!res.ok) return { ok: false, error: data?.error?.message ?? "Erro ao enviar mensagem" };
  return { ok: true, waMessageId: data.messages?.[0]?.id ?? "" };
}
