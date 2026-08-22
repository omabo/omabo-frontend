import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { StepShell } from "@/components/booking/step-shell";
import { PaymentPanel } from "@/components/booking/payment-panel";
import { getPlan, getRestaurant, getTimeSlot, listBookableDates } from "@/lib/booking/mock-data";

export default async function PaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ tenant?: string; date?: string; time?: string; plan?: string; party?: string }>;
}) {
  const t = await getTranslations("booking.payment");
  const tenantSlug = (await headers()).get("x-tenant-slug");
  const { tenant: demoTenant, date, time, plan: planId, party } = await searchParams;
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
  const partySize = party ? Number(party) : NaN;
  if (!Number.isInteger(partySize) || partySize < plan.minPartySize || partySize > plan.maxPartySize) {
    redirect(`/party?date=${date}&time=${slot.id}&plan=${plan.id}`);
  }

  return (
    <StepShell step="payment" backHref={`/guest-info?date=${date}&time=${slot.id}&plan=${plan.id}&party=${partySize}`}>
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold text-foreground">{t("heading")}</h1>
      </div>
      <PaymentPanel
        businessDate={date}
        slotId={slot.id}
        startTimeLabel={slot.startTimeLabel}
        plan={plan}
        partySize={partySize}
        currency={restaurant.currency}
      />
    </StepShell>
  );
}
