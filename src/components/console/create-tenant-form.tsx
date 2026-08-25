"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { consoleCopy } from "@/lib/console/copy";
import { createTenantAction } from "@/lib/console/actions";
import type { TenantPlan } from "@/lib/console/mock-store";

const PLAN_LABEL: Record<TenantPlan, string> = { trial: "trial", standard: "standard", premium: "premium" };

export function CreateTenantForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [plan, setPlan] = useState<TenantPlan>("trial");
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="max-w-md space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await createTenantAction({ slug, name, contactEmail, plan });
          if (!result.ok) {
            setError(result.message);
            return;
          }
          router.push(`/admin-console/tenants/${slug}`);
        });
      }}
    >
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="space-y-1.5">
        <Label htmlFor="name">{consoleCopy.tenants.name}</Label>
        <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="slug">{consoleCopy.tenants.slug}</Label>
        <Input
          id="slug"
          required
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase())}
          placeholder="my-restaurant"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="contactEmail">{consoleCopy.tenants.contactEmail}</Label>
        <Input id="contactEmail" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>{consoleCopy.tenants.plan}</Label>
        <Select value={plan} onValueChange={(v) => setPlan((v ?? "trial") as TenantPlan)}>
          <SelectTrigger>
            <SelectValue>{(v: TenantPlan) => PLAN_LABEL[v]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="trial">trial</SelectItem>
            <SelectItem value="standard">standard</SelectItem>
            <SelectItem value="premium">premium</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={pending}>
        {consoleCopy.createTenant.submit}
      </Button>
    </form>
  );
}
