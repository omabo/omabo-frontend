"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function parseYearMonth(dateStr: string): { year: number; month: number } {
  const [year, month] = dateStr.split("-").map(Number);
  return { year, month: month - 1 };
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function BookingCalendar({
  bookableDates,
  selectedDate,
}: {
  bookableDates: string[];
  selectedDate?: string;
}) {
  const router = useRouter();
  const t = useTranslations("booking.date");
  const bookableSet = useMemo(() => new Set(bookableDates), [bookableDates]);
  const minMonth = parseYearMonth(bookableDates[0]);
  const maxMonth = parseYearMonth(bookableDates[bookableDates.length - 1]);

  const [view, setView] = useState(() => parseYearMonth(selectedDate ?? bookableDates[0]));

  const monthLabel = new Date(Date.UTC(view.year, view.month, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  const daysInMonth = new Date(Date.UTC(view.year, view.month + 1, 0)).getUTCDate();
  const firstWeekday = new Date(Date.UTC(view.year, view.month, 1)).getUTCDay();

  const cells: (string | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => `${view.year}-${pad(view.month + 1)}-${pad(i + 1)}`),
  ];

  const isBeforeMin = view.year === minMonth.year && view.month === minMonth.month;
  const isAfterMax = view.year === maxMonth.year && view.month === maxMonth.month;

  const goToMonth = (delta: number) => {
    setView((current) => {
      const next = new Date(Date.UTC(current.year, current.month + delta, 1));
      return { year: next.getUTCFullYear(), month: next.getUTCMonth() };
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="icon-sm"
          aria-label={t("prevMonth")}
          disabled={isBeforeMin}
          onClick={() => goToMonth(-1)}
        >
          <ChevronLeft />
        </Button>
        <span className="text-sm font-medium">{monthLabel}</span>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label={t("nextMonth")}
          disabled={isAfterMax}
          onClick={() => goToMonth(1)}
        >
          <ChevronRight />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {WEEKDAY_LABELS.map((label, i) => (
          <div key={i}>{label}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((dateStr, i) => {
          if (!dateStr) return <div key={`pad-${i}`} />;
          const bookable = bookableSet.has(dateStr);
          const isSelected = dateStr === selectedDate;
          const day = Number(dateStr.slice(-2));
          return (
            <button
              key={dateStr}
              type="button"
              disabled={!bookable}
              aria-current={isSelected ? "date" : undefined}
              onClick={() => router.replace(`/date?date=${dateStr}`, { scroll: false })}
              className={cn(
                "aspect-square rounded-md text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                !bookable && "text-muted-foreground/40",
                bookable && !isSelected && "hover:bg-accent hover:text-accent-foreground",
                isSelected && "bg-primary font-medium text-primary-foreground"
              )}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
