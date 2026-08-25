import { redirect } from "next/navigation";
import Link from "next/link";

import { consoleCopy } from "@/lib/console/copy";
import { getConsoleSession, logout } from "@/lib/console/session";

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const session = await getConsoleSession();
  if (!session) {
    redirect("/admin-console/login");
  }

  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <span className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Platform Console</span>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/admin-console" className="hover:text-primary">
                {consoleCopy.nav.tenants}
              </Link>
              <Link href="/admin-console/privileged-access-log" className="hover:text-primary">
                {consoleCopy.nav.privilegedAccessLog}
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{session.email}</span>
            <form action={logout}>
              <button type="submit" className="hover:text-foreground">
                {consoleCopy.nav.logout}
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-4 py-6">{children}</div>
    </div>
  );
}
