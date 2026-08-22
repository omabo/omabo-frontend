import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { StepShell } from "@/components/booking/step-shell";
import { PartySizeStepper } from "@/components/booking/party-size-stepper";
import { getPlan, getRestaurant, getTimeSlot, listBookableDates } from "@/lib/booking/mock-data";

export default async function PartyPage({
  searchParams,
}: {
  searchParams: Promise<{ tenant?: string; date?: string; time?: string; plan?: string }>;
}) {
  const t = await getTranslations("booking.party");
  const tenantSlug = (await headers()).get("x-tenant-slug");
  const { tenant: demoTenant, date, time, plan: planId } = await searchParams;
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
  const plan = planId ? getPlan(planId) : undefined;
  if (!plan) {
    redirect(`/plan?date=${date}&time=${slot.id}`);
  }

  return (
    <StepShell step="party" backHref={`/plan?date=${date}&time=${slot.id}`}>
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold text-foreground">{t("heading")}</h1>
        <p className="text-sm text-muted-foreground">{plan.name}</p>
      </div>
      <PartySizeStepper min={plan.minPartySize} max={plan.maxPartySize} businessDate={date} slotId={slot.id} planId={plan.id} />
    </StepShell>
  );
}
