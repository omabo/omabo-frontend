"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  CONSOLE_SESSION_COOKIE,
  type ConsoleLoginState,
  type ConsoleSession,
} from "@/lib/console/session-constants";

export async function login(_prevState: ConsoleLoginState, formData: FormData): Promise<ConsoleLoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/") || "/";

  // Demo-only: same "wrong" sentinel pattern as the tenant admin login.
  if (password === "wrong" || password.length === 0 || email.length === 0) {
    return { status: "error", message: "メールアドレスまたはパスワードが正しくありません。" };
  }

  const store = await cookies();
  store.set(CONSOLE_SESSION_COOKIE, JSON.stringify({ email } satisfies ConsoleSession), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  redirect(next);
}

export async function logout() {
  const store = await cookies();
  store.delete(CONSOLE_SESSION_COOKIE);
  redirect("/admin-console/login");
}

export async function getConsoleSession(): Promise<ConsoleSession | null> {
  const store = await cookies();
  const raw = store.get(CONSOLE_SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ConsoleSession;
  } catch {
    return null;
  }
}
