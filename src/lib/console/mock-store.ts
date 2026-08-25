// Phase 0: in-memory store for the Super Admin Console. Intentionally not
// wired to src/lib/booking/mock-data.ts or src/lib/admin/mock-store.ts —
// this represents omabo's own platform-operator view across all tenants,
// not any single restaurant's data.

export type TenantPlan = "trial" | "standard" | "premium";
export type TenantStatus = "active" | "suspended";

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  contactEmail: string;
  plan: TenantPlan;
  status: TenantStatus;
  createdAt: string;
}

export interface PrivilegedAccessLogEntry {
  id: string;
  at: string;
  operatorEmail: string;
  tenantSlug: string;
  reason: string;
}

let tenants: Tenant[] = [
  {
    id: "tenant_1",
    slug: "default",
    name: "omabo",
    contactEmail: "hello@omabo-trattoria.example",
    plan: "standard",
    status: "active",
    createdAt: "2026-06-01T09:00:00+09:00",
  },
  {
    id: "tenant_2",
    slug: "sakura-diner",
    name: "Sakura Diner",
    contactEmail: "contact@sakura-diner.example",
    plan: "trial",
    status: "active",
    createdAt: "2026-07-15T09:00:00+09:00",
  },
  {
    id: "tenant_3",
    slug: "old-town-grill",
    name: "Old Town Grill",
    contactEmail: "owner@oldtowngrill.example",
    plan: "premium",
    status: "suspended",
    createdAt: "2026-03-20T09:00:00+09:00",
  },
];

let privilegedAccessLog: PrivilegedAccessLogEntry[] = [];

export function listTenants(): Tenant[] {
  return tenants;
}

export function getTenantBySlug(slug: string): Tenant | undefined {
  return tenants.find((t) => t.slug === slug);
}

export function slugExists(slug: string): boolean {
  return tenants.some((t) => t.slug === slug);
}

export function createTenant(input: { slug: string; name: string; contactEmail: string; plan: TenantPlan }): Tenant {
  const tenant: Tenant = {
    id: `tenant_${Date.now()}`,
    status: "active",
    createdAt: new Date().toISOString(),
    ...input,
  };
  tenants.push(tenant);
  return tenant;
}

export function setTenantStatus(slug: string, status: TenantStatus): void {
  const tenant = tenants.find((t) => t.slug === slug);
  if (tenant) tenant.status = status;
}

export function recordPrivilegedAccess(operatorEmail: string, tenantSlug: string, reason: string): void {
  privilegedAccessLog.unshift({
    id: `pal_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    at: new Date().toISOString(),
    operatorEmail,
    tenantSlug,
    reason,
  });
}

export function listPrivilegedAccessLog(): PrivilegedAccessLogEntry[] {
  return privilegedAccessLog;
}
