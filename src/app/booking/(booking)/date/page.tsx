import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { StepShell } from "@/components/booking/step-shell";
import { BookingCalendar } from "@/components/booking/calendar";
import { TimeSlotGrid } from "@/components/booking/time-slot-grid";
import { formatBusinessDate } from "@/lib/datetime";
import { getRestaurant, listBookableDates, listTimeSlots } from "@/lib/booking/mock-data";

export default async function DatePage({
  searchParams,
}: {
  searchParams: Promise<{ tenant?: string; date?: string }>;
}) {
  const t = await getTranslations("booking.date");
  const tenantSlug = (await headers()).get("x-tenant-slug");
  const { tenant: demoTenant, date } = await searchParams;
  const restaurant = getRestaurant(tenantSlug, demoTenant);

  if (restaurant.isPaused || !restaurant.acceptingReservations) {
    redirect("/");
  }

  const bookableDates = listBookableDates(restaurant);
  const selectedDate = date && bookableDates.includes(date) ? date : undefined;
  const slots = selectedDate ? listTimeSlots(restaurant, selectedDate) : null;

  return (
    <StepShell step="date" backHref="/">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold text-foreground">{t("heading")}</h1>
        <p className="text-sm text-muted-foreground">{t("subheading")}</p>
      </div>
      <BookingCalendar bookableDates={bookableDates} selectedDate={selectedDate} />
      {selectedDate && slots ? (
        <div className="space-y-3 border-t border-border pt-5">
          <p className="text-sm font-medium text-foreground">{formatBusinessDate(selectedDate)}</p>
          <TimeSlotGrid businessDate={selectedDate} slots={slots} />
        </div>
      ) : null}
    </StepShell>
  );
}
