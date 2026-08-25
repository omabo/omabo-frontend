"use server";

import { revalidatePath } from "next/cache";

import {
  createTenant,
  recordPrivilegedAccess,
  setTenantStatus,
  slugExists,
  type TenantPlan,
  type TenantStatus,
} from "@/lib/console/mock-store";
import { getConsoleSession } from "@/lib/console/session";

export type ConsoleActionResult = { ok: true } | { ok: false; message: string };

export async function createTenantAction(input: {
  slug: string;
  name: string;
  contactEmail: string;
  plan: TenantPlan;
}): Promise<ConsoleActionResult> {
  if (!input.slug || !input.name) {
    return { ok: false, message: "テナント名とslugは必須です。" };
  }
  if (!/^[a-z0-9-]+$/.test(input.slug)) {
    return { ok: false, message: "slugは半角英小文字・数字・ハイフンのみ使用できます。" };
  }
  if (slugExists(input.slug)) {
    return { ok: false, message: "そのslugは既に使用されています。" };
  }
  createTenant(input);
  revalidatePath("/admin-console");
  return { ok: true };
}

export async function setTenantStatusAction(slug: string, status: TenantStatus): Promise<ConsoleActionResult> {
  setTenantStatus(slug, status);
  revalidatePath("/admin-console");
  revalidatePath(`/admin-console/tenants/${slug}`);
  return { ok: true };
}

export async function recordPrivilegedAccessAction(tenantSlug: string, reason: string): Promise<ConsoleActionResult> {
  if (!reason.trim()) {
    return { ok: false, message: "アクセス理由を入力してください。" };
  }
  const session = await getConsoleSession();
  recordPrivilegedAccess(session?.email ?? "unknown", tenantSlug, reason);
  revalidatePath("/admin-console/privileged-access-log");
  return { ok: true };
}
