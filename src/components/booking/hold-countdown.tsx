"use client";

import { useTranslations } from "next-intl";

import { formatCountdown } from "@/lib/datetime";
import { useBookingFlow } from "@/lib/booking/flow-context";

export function HoldCountdown() {
  const t = useTranslations("booking.holdCountdown");
  const { msRemaining } = useBookingFlow();

  if (msRemaining === null) return null;

  const urgent = msRemaining < 30_000;

  return (
    <div
      role="status"
      className={`flex items-center justify-between rounded-lg border px-4 py-2.5 text-sm ${
        urgent
          ? "border-destructive/30 bg-destructive/5 text-destructive"
          : "border-border bg-muted/50 text-muted-foreground"
      }`}
    >
      <span>{t("label")}</span>
      <span className="font-mono font-medium tabular-nums">{formatCountdown(msRemaining)}</span>
    </div>
  );
}
