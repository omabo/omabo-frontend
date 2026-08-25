import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TenantDetailActions } from "@/components/console/tenant-detail-actions";
import { consoleCopy } from "@/lib/console/copy";
import { getTenantBySlug } from "@/lib/console/mock-store";

export default async function TenantDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tenant = getTenantBySlug(slug);
  if (!tenant) notFound();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold">{tenant.name}</h1>
        <Badge variant={tenant.status === "active" ? "secondary" : "outline"}>
          {tenant.status === "active" ? consoleCopy.tenants.active : consoleCopy.tenants.suspended}
        </Badge>
      </div>

      <Card>
        <CardContent className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{consoleCopy.tenants.slug}</span>
            <span className="font-mono">{tenant.slug}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{consoleCopy.tenants.contactEmail}</span>
            <span>{tenant.contactEmail}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{consoleCopy.tenants.plan}</span>
            <span>{tenant.plan}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{consoleCopy.tenants.createdAt}</span>
            <span>{new Date(tenant.createdAt).toLocaleDateString("ja-JP")}</span>
          </div>
        </CardContent>
      </Card>

      <TenantDetailActions tenant={tenant} />
    </div>
  );
}
