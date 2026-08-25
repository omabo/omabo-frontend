import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { consoleCopy } from "@/lib/console/copy";
import { listTenants } from "@/lib/console/mock-store";

export default async function TenantListPage() {
  const tenants = listTenants();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{consoleCopy.tenants.title}</h1>
        <Button render={<Link href="/admin-console/tenants/new" />} nativeButton={false}>
          {consoleCopy.tenants.create}
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{consoleCopy.tenants.name}</TableHead>
            <TableHead>{consoleCopy.tenants.slug}</TableHead>
            <TableHead>{consoleCopy.tenants.plan}</TableHead>
            <TableHead>{consoleCopy.tenants.status}</TableHead>
            <TableHead>{consoleCopy.tenants.createdAt}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tenants.map((tenant) => (
            <TableRow key={tenant.id}>
              <TableCell>
                <Link href={`/admin-console/tenants/${tenant.slug}`} className="font-medium hover:underline">
                  {tenant.name}
                </Link>
              </TableCell>
              <TableCell className="font-mono text-xs">{tenant.slug}</TableCell>
              <TableCell>{tenant.plan}</TableCell>
              <TableCell>
                <Badge variant={tenant.status === "active" ? "secondary" : "outline"}>
                  {tenant.status === "active" ? consoleCopy.tenants.active : consoleCopy.tenants.suspended}
                </Badge>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {new Date(tenant.createdAt).toLocaleDateString("ja-JP")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
