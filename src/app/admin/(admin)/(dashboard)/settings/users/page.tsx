import { PermissionDenied } from "@/components/admin/permission-denied";
import { UserManagementTable } from "@/components/admin/user-management-table";
import { copy } from "@/lib/admin/copy";
import { listAdminUsers } from "@/lib/admin/mock-store";
import { getSession } from "@/lib/admin/session";

export default async function UsersPage() {
  const session = await getSession();
  if (session?.role === "staff") return <PermissionDenied />;

  const users = listAdminUsers();

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-6">
      <h1 className="font-heading text-2xl font-semibold text-foreground">{copy.users.title}</h1>
      <UserManagementTable users={users} />
    </main>
  );
}
