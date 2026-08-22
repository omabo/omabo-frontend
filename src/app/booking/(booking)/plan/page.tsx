import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { StepShell } from "@/components/booking/step-shell";
import { PlanSelector } from "@/components/booking/plan-selector";
import { formatBusinessDate } from "@/lib/datetime";
import { getRestaurant, getTimeSlot, listBookableDates, PLANS } from "@/lib/booking/mock-data";
import { ErrorBanner } from "@/components/booking/error-banner";

export default async function PlanPage({
  searchParams,
}: {
  searchParams: Promise<{ tenant?: string; date?: string; time?: string; error?: string }>;
}) {
  const t = await getTranslations("booking.plan");
  const tenantSlug = (await headers()).get("x-tenant-slug");
  const { tenant: demoTenant, date, time, error } = await searchParams;
  const restaurant = getRestaurant(tenantSlug, demoTenant);

  if (restaurant.isPaused || !restaurant.acceptingReservations) {
    redirect("/");
  }
  if (!date || !listBookableDates(restaurant).includes(date)) {
    redirect("/date");
  }
  const slot = time ? getTimeSlot(restaurant, date, time) : undefined;
  if (!slot) {
    redirect(`/date?date=${date}`);
  }

  return (
    <StepShell step="plan" backHref={`/date?date=${date}`}>
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold text-foreground">{t("heading")}</h1>
        <p className="text-sm text-muted-foreground">
          {formatBusinessDate(date)} · {slot.startTimeLabel}
        </p>
      </div>
      {error === "slot_full" ? <ErrorBanner message={t("slotFullError")} /> : null}
      <PlanSelector plans={PLANS} businessDate={date} slotId={slot.id} currency={restaurant.currency} />
    </StepShell>
  );
}
