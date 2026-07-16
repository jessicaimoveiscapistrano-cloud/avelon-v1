"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);

    if (res?.error) {
      setError("E-mail ou senha inválidos.");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1.05fr 1fr" }}>
      <div
        style={{
          background: "linear-gradient(160deg, #111a33 0%, #0c1224 100%)",
          color: "#f4f2ea",
          padding: 56,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, letterSpacing: "0.06em", textTransform: "uppercase", color: "#cfd4e6" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#b8923f" }} />
            Avelon CRM
          </div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 38, lineHeight: 1.12, fontWeight: 500, maxWidth: "9.5em", marginTop: 60 }}>
            Cada imóvel tem uma <em style={{ color: "#b8923f", fontStyle: "italic" }}>história</em>.
          </div>
        </div>
        <div style={{ color: "#9aa1ba", fontSize: 12.5 }}>Imobiliária Avelon</div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 40, background: "#fff" }}>
        <div style={{ width: "100%", maxWidth: 360 }}>
          <h2 style={{ margin: "0 0 4px", fontSize: 22, fontFamily: "Georgia, serif" }}>Entrar</h2>
          <p style={{ color: "#6b7280", fontSize: 13, margin: "0 0 24px" }}>Acesse o CRM da sua imobiliária</p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "#3a3d45" }}>E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: "1px solid #e5e2d9", fontSize: 13.5 }}
              />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "#3a3d45" }}>Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: "1px solid #e5e2d9", fontSize: 13.5 }}
              />
            </div>
            {error && <p style={{ color: "#c2483f", fontSize: 13, marginBottom: 14 }}>{error}</p>}
            <button
              type="submit"
              disabled={loading}
              style={{ width: "100%", padding: 11, borderRadius: 9, border: "none", background: "#111a33", color: "#fff", fontWeight: 700, fontSize: 14 }}
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
