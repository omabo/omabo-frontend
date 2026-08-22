"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { TimeSlot } from "@/lib/booking/mock-data";

export function TimeSlotGrid({ businessDate, slots }: { businessDate: string; slots: TimeSlot[] }) {
  const router = useRouter();
  const t = useTranslations("booking.time");

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {slots.map((slot) => {
        const isFull = slot.status === "full";
        return (
          <Card
            key={slot.id}
            role="button"
            aria-disabled={isFull}
            tabIndex={isFull ? -1 : 0}
            onClick={() => {
              if (isFull) return;
              router.push(`/plan?date=${businessDate}&time=${slot.id}`);
            }}
            onKeyDown={(event) => {
              if (isFull) return;
              if (event.key === "Enter" || event.key === " ") {
                router.push(`/plan?date=${businessDate}&time=${slot.id}`);
              }
            }}
            className={cn(
              "items-center justify-center gap-1 px-3 py-4 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isFull
                ? "cursor-not-allowed opacity-50"
                : "cursor-pointer hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <span className="text-sm font-medium">{slot.startTimeLabel}</span>
            {slot.status === "full" ? (
              <Badge variant="destructive" className="text-[10px]">
                {t("statusFull")}
              </Badge>
            ) : slot.status === "almost-full" ? (
              <Badge variant="secondary" className="text-[10px]">
                {t("statusAlmostFull")}
              </Badge>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
