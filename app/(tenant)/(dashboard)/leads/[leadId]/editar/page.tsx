"use client";
import { useEffect, useState } from "react";
import LeadForm from "@/components/leads/LeadForm";
import LeadWhatsAppChat from "@/components/leads/LeadWhatsAppChat";

export default function EditarLeadPage({ params }: { params: { leadId: string } }) {
  const [lead, setLead] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/leads/${params.leadId}`).then((r) => r.json()).then(setLead);
  }, [params.leadId]);

  if (!lead) return <div className="p-8 text-slate-400">Carregando...</div>;

  return (
    <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <h1 className="text-xl font-semibold mb-6">Editar lead</h1>
        <LeadForm initialData={lead} />
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-6">Conversa</h2>
        <LeadWhatsAppChat leadId={lead.id} />
      </div>
    </div>
  );
}
