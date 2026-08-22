import Link from "next/link";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { getRestaurant } from "@/lib/booking/mock-data";
import { DemoPanel } from "@/components/booking/demo-panel";

export default async function BookingTopPage({
  searchParams,
}: {
  searchParams: Promise<{ tenant?: string }>;
}) {
  const t = await getTranslations("booking.top");
  const tenantSlug = (await headers()).get("x-tenant-slug");
  const { tenant: demoTenant } = await searchParams;
  const restaurant = getRestaurant(tenantSlug, demoTenant);

  return (
    <main className="flex min-h-svh flex-col">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-8 px-4 py-16 sm:px-6">
        <div className="space-y-3">
          <p className="text-sm font-medium tracking-wide text-primary uppercase">{t("eyebrow")}</p>
          <h1 className="font-heading text-4xl font-semibold text-balance text-foreground sm:text-5xl">
            {restaurant.name}
          </h1>
          <p className="max-w-md text-base text-muted-foreground">{t("tagline")}</p>
        </div>

        {restaurant.isPaused ? (
          <div className="rounded-lg border border-border bg-muted/50 px-4 py-4 text-sm text-muted-foreground">
            {t("pausedNotice")}
          </div>
        ) : !restaurant.acceptingReservations ? (
          <div className="rounded-lg border border-border bg-muted/50 px-4 py-4 text-sm text-muted-foreground">
            {t("closedNotice")}
          </div>
        ) : (
          <div>
            <Button size="lg" className="h-11 px-6 text-base" render={<Link href="/date" />} nativeButton={false}>
              {t("cta")}
            </Button>
          </div>
        )}

        <p className="text-sm text-muted-foreground">
          {t("contactPrefix")}{" "}
          <a className="underline underline-offset-2" href={`mailto:${restaurant.contactEmail}`}>
            {restaurant.contactEmail}
          </a>{" "}
          · {restaurant.contactPhone}
        </p>
      </div>

      <DemoPanel />
    </main>
  );
}
