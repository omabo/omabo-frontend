import { PermissionDenied } from "@/components/admin/permission-denied";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { copy } from "@/lib/admin/copy";
import { listAuditLog } from "@/lib/admin/mock-store";
import { getSession } from "@/lib/admin/session";

export default async function AuditLogPage() {
  const session = await getSession();
  if (session?.role === "staff") return <PermissionDenied />;

  const entries = listAuditLog();

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-6">
      <h1 className="font-heading text-2xl font-semibold text-foreground">{copy.auditLog.title}</h1>
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">{copy.auditLog.empty}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{copy.auditLog.time}</TableHead>
              <TableHead>{copy.auditLog.actor}</TableHead>
              <TableHead>{copy.auditLog.action}</TableHead>
              <TableHead>{copy.auditLog.detail}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(entry.at).toLocaleString("ja-JP")}
                </TableCell>
                <TableCell>{entry.actorEmail}</TableCell>
                <TableCell>{entry.action}</TableCell>
                <TableCell className="text-muted-foreground">{entry.detail ?? "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </main>
  );
}
