"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  ADMIN_SESSION_COOKIE,
  type AdminRole,
  type AdminSession,
  type LoginState,
} from "@/lib/admin/session-constants";
import { logAudit } from "@/lib/admin/mock-store";

// Phase 0 only: there's no user database yet, so role is derived from the
// email address itself, purely so every role-gated behavior in the admin
// screens (staff vs admin vs super_admin) can be demoed without a backend.
function resolveRole(email: string): AdminRole {
  if (email.includes("super")) return "super_admin";
  if (email.includes("admin")) return "admin";
  return "staff";
}

const FAILED_ATTEMPTS = new Map<string, { count: number; lockedUntil: number }>();
const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

function recordFailure(email: string) {
  const entry = FAILED_ATTEMPTS.get(email) ?? { count: 0, lockedUntil: 0 };
  entry.count += 1;
  if (entry.count >= LOCKOUT_THRESHOLD) {
    entry.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
    entry.count = 0;
  }
  FAILED_ATTEMPTS.set(email, entry);
}

function isLocked(email: string): boolean {
  const entry = FAILED_ATTEMPTS.get(email);
  return !!entry && entry.lockedUntil > Date.now();
}

async function setSessionCookie(session: AdminSession) {
  const store = await cookies();
  store.set(ADMIN_SESSION_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
}

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const stage = String(formData.get("stage") ?? "credentials");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const next = String(formData.get("next") ?? "/") || "/";

  if (stage === "mfa-setup-confirm") {
    const role = resolveRole(email);
    await setSessionCookie({ email, role });
    logAudit(email, "ログイン(MFA設定完了)");
    redirect(next);
  }

  if (stage === "mfa") {
    const mfaCode = String(formData.get("mfaCode") ?? "");
    if (!/^\d{6}$/.test(mfaCode)) {
      return { status: "error", message: "コードが正しくありません。もう一度お試しください。" };
    }
    await setSessionCookie({ email, role: resolveRole(email) });
    logAudit(email, "ログイン(MFA)");
    redirect(next);
  }

  // stage === "credentials"
  const password = String(formData.get("password") ?? "");

  if (isLocked(email)) {
    return { status: "error", message: "しばらく時間をおいてから再度お試しください。" };
  }

  // Demo-only sentinel: a password of "wrong" always fails, so the
  // incorrect-credentials and lockout states can be exercised on demand.
  if (password === "wrong" || password.length === 0) {
    recordFailure(email);
    return { status: "error", message: "メールアドレスまたはパスワードが正しくありません。" };
  }
  FAILED_ATTEMPTS.delete(email);

  const role = resolveRole(email);

  if (role === "super_admin") {
    return { status: "mfa-setup-required", email, role, next };
  }

  if (email.includes("mfa")) {
    return { status: "mfa-challenge", email, next };
  }

  await setSessionCookie({ email, role });
  logAudit(email, "ログイン");
  redirect(next);
}

export async function logout() {
  const session = await getSession();
  const store = await cookies();
  store.delete(ADMIN_SESSION_COOKIE);
  if (session) logAudit(session.email, "ログアウト");
  redirect("/login");
}

export async function getSession(): Promise<AdminSession | null> {
  const store = await cookies();
  const raw = store.get(ADMIN_SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminSession;
  } catch {
    return null;
  }
}
