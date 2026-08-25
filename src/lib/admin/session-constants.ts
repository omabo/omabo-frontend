// Shared by proxy.ts (middleware) and session.ts (Server Actions).
// Kept dependency-free so importing it from middleware never risks pulling
// in "use server" wiring or Node-only APIs into the Edge bundle.
export const ADMIN_SESSION_COOKIE = "omabo_admin_session";

export type AdminRole = "staff" | "admin" | "super_admin";

export interface AdminSession {
  email: string;
  role: AdminRole;
}

export type LoginState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "mfa-challenge"; email: string; next: string }
  | { status: "mfa-setup-required"; email: string; role: AdminRole; next: string };

export const IDLE_LOGIN_STATE: LoginState = { status: "idle" };
