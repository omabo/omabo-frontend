import { PermissionDenied } from "@/components/admin/permission-denied";
import { TableManagementList } from "@/components/admin/table-management-list";
import { copy } from "@/lib/admin/copy";
import { listTables } from "@/lib/admin/mock-store";
import { getSession } from "@/lib/admin/session";

export default async function TablesPage() {
  const session = await getSession();
  if (session?.role === "staff") return <PermissionDenied />;

  const tables = listTables();

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-6">
      <h1 className="font-heading text-2xl font-semibold text-foreground">{copy.tables.title}</h1>
      <TableManagementList tables={tables} />
    </main>
  );
}
