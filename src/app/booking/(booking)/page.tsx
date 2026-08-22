import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";

import { fetchHealthz } from "@/lib/api";

export default async function BookingIndexPage() {
  const t = await getTranslations("booking");
  const tenantSlug = (await headers()).get("x-tenant-slug") ?? "(unknown)";

  let backendStatus: string;
  try {
    await fetchHealthz();
    backendStatus = t("backendStatusOk");
  } catch {
    backendStatus = t("backendStatusError");
  }

  return (
    <main>
      <h1>{t("healthcheckTitle")}</h1>
      <p>tenant: {tenantSlug}</p>
      <p>{backendStatus}</p>
    </main>
  );
}
