"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { consoleCopy } from "@/lib/console/copy";
import { recordPrivilegedAccessAction, setTenantStatusAction } from "@/lib/console/actions";
import type { Tenant } from "@/lib/console/mock-store";

export function TenantDetailActions({ tenant }: { tenant: Tenant }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [reason, setReason] = useState("");
  const [accessMessage, setAccessMessage] = useState<string | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <Button
        variant={tenant.status === "active" ? "destructive" : "default"}
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await setTenantStatusAction(tenant.slug, tenant.status === "active" ? "suspended" : "active");
            router.refresh();
          })
        }
      >
        {tenant.status === "active" ? consoleCopy.tenantDetail.suspend : consoleCopy.tenantDetail.activate}
      </Button>

      <div className="space-y-2 rounded-lg border border-border p-4">
        <p className="text-sm font-medium">{consoleCopy.tenantDetail.accessSection}</p>
        <p className="text-xs text-muted-foreground">{consoleCopy.tenantDetail.accessNote}</p>
        {accessMessage ? <p className="text-sm text-muted-foreground">{accessMessage}</p> : null}
        {accessError ? <p className="text-sm text-destructive">{accessError}</p> : null}
        <div className="space-y-1.5">
          <Label htmlFor="reason">{consoleCopy.tenantDetail.accessReason}</Label>
          <Input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="サポート対応のため" />
        </div>
        <Button
          variant="outline"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await recordPrivilegedAccessAction(tenant.slug, reason);
              if (!result.ok) {
                setAccessError(result.message);
                setAccessMessage(null);
                return;
              }
              setAccessError(null);
              setAccessMessage(consoleCopy.tenantDetail.accessRecorded);
              setReason("");
            })
          }
        >
          {consoleCopy.tenantDetail.accessButton}
        </Button>
      </div>
    </div>
  );
}
