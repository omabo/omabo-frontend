import Link from "next/link";

import { cn } from "@/lib/utils";
import { copy } from "@/lib/admin/copy";
import { ChannelDot } from "@/components/admin/calendar/channel-dot";
import { isSameMonth, dayOfMonth } from "@/lib/admin/date-utils";
import { isAnyGroupGeneratedForDate, type Reservation } from "@/lib/admin/mock-store";

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

export function MonthView({
  days,
  month,
  reservationsByDate,
}: {
  days: string[];
  month: string;
  reservationsByDate: Map<string, Reservation[]>;
}) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-7 text-center text-xs text-muted-foreground">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="py-1">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-border bg-border">
        {days.map((day) => {
          const inCurrentMonth = isSameMonth(day, month);
          const dayReservations = reservationsByDate.get(day) ?? [];
          const generated = isAnyGroupGeneratedForDate(day);
          const hasNeedsReview = dayReservations.some((r) => r.status === "needs_review");

          return (
            <Link
              key={day}
              href={`/reservations?view=day&date=${day}`}
              className={cn(
                "flex min-h-24 flex-col gap-1 bg-background p-1.5 text-left transition-colors hover:bg-accent",
                !inCurrentMonth && "bg-muted/40 text-muted-foreground/50"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs">{dayOfMonth(day)}</span>
                {hasNeedsReview ? (
                  <span className="rounded-full bg-destructive/10 px-1.5 py-0.5 text-[9px] font-medium text-destructive">
                    {copy.calendar.needsReviewBadge}
                  </span>
                ) : null}
              </div>
              {!generated ? (
                <span className="text-[10px] text-muted-foreground">{copy.calendar.noSlotsGenerated}</span>
              ) : dayReservations.length > 0 ? (
                <div className="flex flex-wrap gap-0.5">
                  {dayReservations.slice(0, 8).map((r) => (
                    <ChannelDot key={r.id} channel={r.sourceChannel} />
                  ))}
                </div>
              ) : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
