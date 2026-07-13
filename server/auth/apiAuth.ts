import { NextResponse } from "next/server";
import { getSessionUser } from "./session";

type ApiAuthResult =
  | { user: NonNullable<Awaited<ReturnType<typeof getSessionUser>>>; response: null }
  | { user: null; response: NextResponse };

export async function requireApiUser(): Promise<ApiAuthResult> {
  const user = await getSessionUser();
  if (!user) {
    return { user: null, response: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) };
  }
  return { user, response: null };
}
