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
    <div
      style={{
        background: "#fff", border: "1px solid #e5e2d9", borderRadius: 14,
        display: "flex", flexDirection: "column", height: 440,
        boxShadow: "0 1px 2px rgba(17,26,51,.04), 0 8px 24px -12px rgba(17,26,51,.12)",
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "14px 16px", borderBottom: "1px solid #e5e2d9", fontSize: 13.5, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 22, height: 22, borderRadius: 6, background: "#25d366", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="#fff"><path d="M12 2a10 10 0 00-8.6 15L2 22l5.2-1.4A10 10 0 1012 2z" /></svg>
        </span>
        WhatsApp
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 14, background: "#efeae2", display: "flex", flexDirection: "column", gap: 7 }}>
        {messages.length === 0 ? (
          <p style={{ fontSize: 12.5, color: "#9498a3", textAlign: "center", marginTop: 20 }}>Nenhuma mensagem ainda</p>
        ) : (
          messages.map((m) => (
            <div key={m.id} style={{ display: "flex", justifyContent: m.direction === "OUTBOUND" ? "flex-end" : "flex-start" }}>
              <div
                style={{
                  maxWidth: "78%", padding: "8px 11px", borderRadius: 11, fontSize: 12.5,
                  background: m.direction === "OUTBOUND" ? "#d9fdd3" : "#fff",
                  border: m.direction === "OUTBOUND" ? "none" : "1px solid #e5e2d9",
                }}
              >
                {m.body}
              </div>
            </div>
          ))
        )}
      </div>
      <form onSubmit={send} style={{ padding: 10, borderTop: "1px solid #e5e2d9", display: "flex", gap: 8 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Mensagem..."
          style={{ flex: 1, border: "1px solid #e5e2d9", borderRadius: 20, padding: "8px 14px", fontSize: 12.5 }}
        />
        <button style={{ background: "#b8923f", color: "#241b06", border: "none", borderRadius: 20, padding: "8px 16px", fontSize: 12.5, fontWeight: 700 }}>
          Enviar
        </button>
      </form>
    </div>
  );
}
