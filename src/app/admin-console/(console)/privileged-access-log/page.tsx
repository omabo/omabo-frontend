import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { consoleCopy } from "@/lib/console/copy";
import { listPrivilegedAccessLog } from "@/lib/console/mock-store";

export default async function PrivilegedAccessLogPage() {
  const entries = listPrivilegedAccessLog();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{consoleCopy.privilegedAccessLog.title}</h1>
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">{consoleCopy.privilegedAccessLog.empty}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{consoleCopy.privilegedAccessLog.time}</TableHead>
              <TableHead>{consoleCopy.privilegedAccessLog.operator}</TableHead>
              <TableHead>{consoleCopy.privilegedAccessLog.tenant}</TableHead>
              <TableHead>{consoleCopy.privilegedAccessLog.reason}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(entry.at).toLocaleString("ja-JP")}
                </TableCell>
                <TableCell>{entry.operatorEmail}</TableCell>
                <TableCell className="font-mono text-xs">{entry.tenantSlug}</TableCell>
                <TableCell>{entry.reason}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
