import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ViewSwitcher } from "@/components/admin/calendar/view-switcher";
import { MonthView } from "@/components/admin/calendar/month-view";
import { WeekView } from "@/components/admin/calendar/week-view";
import { DayView } from "@/components/admin/calendar/day-view";
import { TableTimeline } from "@/components/admin/calendar/table-timeline";
import { monthGridRange, weekRange, formatFullDateLabel } from "@/lib/admin/date-utils";
import { listReservations, listSeatingPlans, listTables, todaysBusinessDate, type Reservation } from "@/lib/admin/mock-store";
import { copy } from "@/lib/admin/copy";

function groupByDate(reservations: Reservation[]): Map<string, Reservation[]> {
  const map = new Map<string, Reservation[]>();
  for (const r of reservations) {
    const list = map.get(r.businessDate) ?? [];
    list.push(r);
    map.set(r.businessDate, list);
  }
  return map;
}

export default async function ReservationsCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string }>;
}) {
  const { view = "month", date } = await searchParams;
  const activeDate = date ?? todaysBusinessDate();

  if (listSeatingPlans().length === 0) {
    return (
      <main className="mx-auto max-w-2xl space-y-4 p-6 text-center">
        <h1 className="font-heading text-2xl font-semibold text-foreground">{copy.calendar.title}</h1>
        <p className="text-sm text-muted-foreground">{copy.calendar.noSeatingPlan}</p>
        <Button render={<Link href="/settings/seating-plans" />} nativeButton={false}>
          {copy.calendar.goToSeatingPlans}
        </Button>
      </main>
    );
  }

  let body: React.ReactNode;
  if (view === "day") {
    const reservations = listReservations({ from: activeDate, to: activeDate });
    const tables = listTables();
    body = (
      <div className="space-y-6">
        <DayView reservations={reservations} tables={tables} />
        <TableTimeline tables={tables} reservations={reservations} />
      </div>
    );
  } else if (view === "week") {
    const { from, to, days } = weekRange(activeDate);
    const reservations = listReservations({ from, to });
    body = <WeekView days={days} reservationsByDate={groupByDate(reservations)} />;
  } else {
    const { from, to, days } = monthGridRange(activeDate);
    const reservations = listReservations({ from, to });
    body = <MonthView days={days} month={activeDate} reservationsByDate={groupByDate(reservations)} />;
  }

  return (
    <main className="mx-auto max-w-5xl space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">{copy.calendar.title}</h1>
          {view === "day" ? <p className="text-sm text-muted-foreground">{formatFullDateLabel(activeDate)}</p> : null}
        </div>
        <ViewSwitcher view={view} date={activeDate} />
      </div>
      {body}
    </main>
  );
}
