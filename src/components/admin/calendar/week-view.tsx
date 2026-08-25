import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { ChannelDot } from "@/components/admin/calendar/channel-dot";
import { copy } from "@/lib/admin/copy";
import { formatDayLabel } from "@/lib/admin/date-utils";
import type { Reservation } from "@/lib/admin/mock-store";

export function WeekView({ days, reservationsByDate }: { days: string[]; reservationsByDate: Map<string, Reservation[]> }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-7">
      {days.map((day) => {
        const dayReservations = reservationsByDate.get(day) ?? [];
        return (
          <div key={day} className="space-y-1.5 rounded-lg border border-border p-2">
            <Link href={`/reservations?view=day&date=${day}`} className="text-xs font-medium text-foreground hover:underline">
              {formatDayLabel(day)}
            </Link>
            <div className="space-y-1">
              {dayReservations.length === 0 ? (
                <p className="text-[11px] text-muted-foreground">-</p>
              ) : (
                dayReservations.map((r) => (
                  <Link
                    key={r.id}
                    href={`/reservations/${r.id}`}
                    className="flex items-center gap-1 rounded px-1 py-0.5 text-[11px] hover:bg-accent"
                  >
                    <ChannelDot channel={r.sourceChannel} />
                    <span className="tabular-nums">{r.startTimeLabel}</span>
                    <span className="truncate">{r.guestName}</span>
                    {r.status === "needs_review" ? (
                      <Badge variant="destructive" className="ml-auto text-[9px]">
                        {copy.calendar.needsReviewBadge}
                      </Badge>
                    ) : null}
                  </Link>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
