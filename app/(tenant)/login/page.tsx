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
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f6f5f2" }}>
      <div style={{ width: "100%", maxWidth: 380, background: "#fff", borderRadius: 16, border: "1px solid #e5e2d9", padding: 32 }}>
        <h1 style={{ fontSize: 20, margin: "0 0 4px" }}>Entrar</h1>
        <p style={{ color: "#6b7280", fontSize: 13, margin: "0 0 24px" }}>Acesse o CRM da sua imobiliária</p>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>E-mail</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: "1px solid #e5e2d9" }} />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>Senha</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: "1px solid #e5e2d9" }} />
          </div>
          {error && <p style={{ color: "#c2483f", fontSize: 13, marginBottom: 14 }}>{error}</p>}
          <button type="submit" disabled={loading}
            style={{ width: "100%", padding: 11, borderRadius: 9, border: "none", background: "#111a33", color: "#fff", fontWeight: 700 }}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
