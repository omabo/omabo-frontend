import { redirect } from "next/navigation";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { listNeedsReview } from "@/lib/admin/mock-store";
import { getSession } from "@/lib/admin/session";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    // Middleware already gates this, but a stale render shouldn't crash.
    redirect("/login");
  }

  const needsReviewCount = listNeedsReview().length;

  return (
    <div className="flex min-h-svh">
      <AdminSidebar session={session} needsReviewCount={needsReviewCount} />
      <div className="flex-1 overflow-x-auto">{children}</div>
    </div>
  );
}
