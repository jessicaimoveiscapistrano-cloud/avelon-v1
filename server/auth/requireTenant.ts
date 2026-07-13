import { redirect } from "next/navigation";
import { getSessionUser } from "./session";

export async function requireTenantUser() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}
