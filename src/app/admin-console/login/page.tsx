import { ConsoleLoginForm } from "@/components/console/console-login-form";

export default async function ConsoleLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm">
        <ConsoleLoginForm next={next && next.startsWith("/admin-console") ? next : "/admin-console"} />
      </div>
    </main>
  );
}
