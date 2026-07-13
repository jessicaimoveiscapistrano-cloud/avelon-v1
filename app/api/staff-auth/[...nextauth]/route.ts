// app/api/staff-auth/[...nextauth]/route.ts
//
// Handler REST da autenticação de staff. Deliberadamente em um path
// diferente de app/api/auth/[...nextauth] (autenticação do tenant) —
// /api/staff-auth em vez de /api/auth — para que os dois NextAuth
// coexistam no mesmo projeto Next.js sem colidir em rota nem em basePath
// (o NextAuth v4 infere o basePath a partir do path da própria rota).

import NextAuth from "next-auth";
import { staffAuthOptions } from "@/server/auth/staffAuthOptions";

const handler = NextAuth(staffAuthOptions);
export { handler as GET, handler as POST };
