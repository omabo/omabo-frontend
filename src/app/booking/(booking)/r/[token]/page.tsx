import { getTranslations } from "next-intl/server";

import { BookingHeader } from "@/components/booking/step-shell";
import { ManageReservationView } from "@/components/booking/manage/manage-reservation-view";
import { getManagedReservation } from "@/lib/booking/mock-data";

export default async function ManageReservationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const t = await getTranslations("booking.manage");
  const { token } = await params;
  const reservation = getManagedReservation(token);

  if (!reservation) {
    return (
      <main className="mx-auto flex min-h-svh max-w-2xl flex-col items-center justify-center gap-3 px-4 text-center sm:px-6">
        <h1 className="font-heading text-2xl font-semibold text-foreground">{t("invalidTitle")}</h1>
        <p className="max-w-sm text-sm text-muted-foreground">{t("invalidBody")}</p>
      </main>
    );
  }

  return (
    <>
      <BookingHeader restaurantName={reservation.restaurant.name} />
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <ManageReservationView reservation={reservation} />
      </main>
    </>
  );
}
