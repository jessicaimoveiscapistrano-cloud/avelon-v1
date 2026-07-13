type FacebookFieldData = { name: string; values: string[] };
type FacebookLeadResponse = { id: string; created_time: string; field_data: FacebookFieldData[] };

export async function fetchFacebookLeadData(leadgenId: string, pageAccessToken: string): Promise<FacebookLeadResponse | null> {
  const url = `https://graph.facebook.com/v19.0/${leadgenId}?access_token=${pageAccessToken}`;
  const res = await fetch(url);
  if (!res.ok) { console.error("Erro ao buscar lead na Graph API:", await res.text()); return null; }
  return res.json();
}
