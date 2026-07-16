"use client";
import { useEffect, useState } from "react";
import LeadForm from "@/components/leads/LeadForm";
import LeadWhatsAppChat from "@/components/leads/LeadWhatsAppChat";

export default function EditarLeadPage({ params }: { params: { leadId: string } }) {
  const [lead, setLead] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/leads/${params.leadId}`).then((r) => r.json()).then(setLead);
  }, [params.leadId]);

  if (!lead) return <div style={{ padding: 32, color: "#9498a3" }}>Carregando...</div>;

  return (
    <div style={{ padding: 28, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
      <div>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, marginBottom: 20 }}>
          Editar lead
        </h1>
        <LeadForm initialData={lead} />
      </div>
      <div>
        <h2 style={{ fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 700, marginBottom: 20 }}>
          Conversa
        </h2>
        <LeadWhatsAppChat leadId={lead.id} />
      </div>
    </div>
  );
}
