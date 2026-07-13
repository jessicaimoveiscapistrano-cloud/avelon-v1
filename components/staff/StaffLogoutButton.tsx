// components/staff/StaffLogoutButton.tsx
//
// Não usamos <SessionProvider> nem os hooks de next-auth/react para o
// staff, porque esse provider assume um único basePath ("/api/auth") para
// toda a árvore React — e o staff vive em "/api/staff-auth". Em vez disso,
// falamos diretamente com o REST do NextAuth (csrf + signout), o mesmo
// padrão usado na tela de login.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function StaffLogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      const csrfRes = await fetch("/api/staff-auth/csrf");
      const { csrfToken } = await csrfRes.json();

      await fetch("/api/staff-auth/signout", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ csrfToken, json: "true" }),
      });

      router.push("/staff/login");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      style={{
        fontSize: 13,
        fontWeight: 600,
        color: "#c7cbe0",
        background: "transparent",
        border: "1px solid rgba(255,255,255,.15)",
        borderRadius: 8,
        padding: "6px 12px",
        cursor: "pointer",
      }}
    >
      {loading ? "Saindo..." : "Sair"}
    </button>
  );
}
