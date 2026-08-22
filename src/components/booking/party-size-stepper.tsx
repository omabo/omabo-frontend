"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

export function PartySizeStepper({
  min,
  max,
  businessDate,
  slotId,
  planId,
}: {
  min: number;
  max: number;
  businessDate: string;
  slotId: string;
  planId: string;
}) {
  const [partySize, setPartySize] = useState(min);
  const router = useRouter();
  const t = useTranslations("booking.party");

  return (
    <div className="flex flex-col items-center gap-8 py-8">
      <div className="flex items-center gap-6">
        <Button
          variant="outline"
          size="icon-lg"
          aria-label={t("decrease")}
          disabled={partySize <= min}
          onClick={() => setPartySize((n) => Math.max(min, n - 1))}
        >
          <Minus />
        </Button>
        <span className="w-16 text-center font-heading text-4xl font-semibold tabular-nums">{partySize}</span>
        <Button
          variant="outline"
          size="icon-lg"
          aria-label={t("increase")}
          disabled={partySize >= max}
          onClick={() => setPartySize((n) => Math.min(max, n + 1))}
        >
          <Plus />
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">{t("range", { min, max })}</p>
      <Button
        size="lg"
        className="h-11 w-full max-w-xs"
        onClick={() =>
          router.push(`/guest-info?date=${businessDate}&time=${slotId}&plan=${planId}&party=${partySize}`)
        }
      >
        {t("continue")}
      </Button>
    </div>
  );
}
