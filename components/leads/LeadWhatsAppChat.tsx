"use client";
import { useEffect, useState } from "react";

export default function LeadWhatsAppChat({ leadId }: { leadId: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");

  function load() {
    fetch(`/api/leads/${leadId}/whatsapp`).then((r) => r.json()).then(setMessages);
  }
  useEffect(load, [leadId]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    await fetch(`/api/leads/${leadId}/whatsapp`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }),
    });
    setText(""); load();
  }

  return (
    <div className="bg-white border rounded-2xl flex flex-col h-[420px]">
      <div className="px-4 py-3 border-b font-semibold text-sm">WhatsApp</div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.direction === "OUTBOUND" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${m.direction === "OUTBOUND" ? "bg-indigo-600 text-white" : "bg-white border"}`}>
              {m.body}
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={send} className="p-3 border-t flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Mensagem..."
          className="flex-1 border rounded-lg px-3 py-2 text-sm" />
        <button className="bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm">Enviar</button>
      </form>
    </div>
  );
}
