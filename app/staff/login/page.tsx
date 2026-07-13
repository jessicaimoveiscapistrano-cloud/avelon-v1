// app/staff/login/page.tsx
//
// Não usamos signIn() de "next-auth/react" aqui de propósito: esse helper
// depende de um <SessionProvider> configurado com um único basePath para
// toda a aplicação, e o app já tem um SessionProvider do lado tenant
// apontando para "/api/auth". Para manter os dois domínios de identidade
// realmente independentes (inclusive no client), a tela de staff fala
// diretamente com o REST do NextAuth em "/api/staff-auth".

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function StaffLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const csrfRes = await fetch("/api/staff-auth/csrf");
      const { csrfToken } = await csrfRes.json();

      const res = await fetch("/api/staff-auth/callback/avelon-staff-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          email,
          password,
          csrfToken,
          json: "true",
        }),
      });

      const data = await res.json().catch(() => null);

      // o NextAuth REST retorna 200 com uma url mesmo em falha de credenciais
      // (não usa status 401 no callback) — por isso checamos a própria sessão
      // em seguida para confirmar se autenticou de fato
      const sessionRes = await fetch("/api/staff-auth/session");
      const session = await sessionRes.json().catch(() => null);

      if (!session?.user?.staffId) {
        setError("E-mail ou senha inválidos.");
        setLoading(false);
        return;
      }

      router.push("/staff");
      router.refresh();
    } catch {
      setError("Não foi possível conectar. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0d1326",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 380,
          background: "#12182e",
          border: "1px solid rgba(255,255,255,.08)",
          borderRadius: 14,
          padding: 32,
        }}
      >
        <div style={{ color: "#8b91ab", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
          Avelon Platform
        </div>
        <h1 style={{ color: "#f1f2f8", fontSize: 20, margin: "0 0 4px" }}>Acesso interno</h1>
        <p style={{ color: "#8b91ab", fontSize: 13, margin: "0 0 24px" }}>
          Restrito à equipe Avelon. Clientes devem acessar em /login.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 13, color: "#c7cbe0", marginBottom: 6 }}>E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,.12)",
                background: "#0d1326",
                color: "#f1f2f8",
                fontSize: 14,
              }}
            />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontSize: 13, color: "#c7cbe0", marginBottom: 6 }}>Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,.12)",
                background: "#0d1326",
                color: "#f1f2f8",
                fontSize: 14,
              }}
            />
          </div>

          {error && <p style={{ color: "#e3897f", fontSize: 13, marginBottom: 14 }}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "11px",
              borderRadius: 8,
              border: "none",
              background: "#b8923f",
              color: "#241b06",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
