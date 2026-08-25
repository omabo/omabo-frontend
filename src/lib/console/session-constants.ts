// Platform-operator session for the Super Admin Console (/admin-console/*).
// Deliberately separate from src/lib/admin/session-constants.ts: that cookie
// authenticates a single restaurant's staff/admin, this one authenticates
// omabo's own operations team across all tenants.
export const CONSOLE_SESSION_COOKIE = "omabo_console_session";

export interface ConsoleSession {
  email: string;
}

export type ConsoleLoginState = { status: "idle" } | { status: "error"; message: string };

export const IDLE_CONSOLE_LOGIN_STATE: ConsoleLoginState = { status: "idle" };
