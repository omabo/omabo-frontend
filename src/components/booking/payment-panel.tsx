"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HoldCountdown } from "@/components/booking/hold-countdown";
import { ErrorBanner } from "@/components/booking/error-banner";
import { useBookingFlow } from "@/lib/booking/flow-context";
import { submitPayment, type Plan } from "@/lib/booking/mock-data";
import { formatBusinessDate } from "@/lib/datetime";

export function PaymentPanel({
  businessDate,
  slotId,
  startTimeLabel,
  plan,
  partySize,
  currency,
}: {
  businessDate: string;
  slotId: string;
  startTimeLabel: string;
  plan: Plan;
  partySize: number;
  currency: string;
}) {
  const router = useRouter();
  const t = useTranslations("booking.payment");
  const { hold, guestInfo, clearHold } = useBookingFlow();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const formatter = new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 });

  useEffect(() => {
    if (!hold || !guestInfo) {
      router.replace(`/guest-info?date=${businessDate}&time=${slotId}&plan=${plan.id}&party=${partySize}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!hold || !guestInfo) {
    return null;
  }

  return (
    <div className="space-y-5">
      <HoldCountdown />

      <Card>
        <CardContent className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{formatBusinessDate(businessDate)}</span>
            <span>{startTimeLabel}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{plan.name}</span>
            <span>{t("partyCount", { count: partySize })}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2 font-medium">
            <span>{t("total")}</span>
            <span>{formatter.format((plan.priceCents * partySize) / 100)}</span>
          </div>
        </CardContent>
      </Card>

      {errorMessage ? <ErrorBanner message={errorMessage} /> : null}

      <p className="text-xs text-muted-foreground">{t("disclaimer")}</p>

      <Button
        size="lg"
        className="h-11 w-full"
        disabled={submitting}
        onClick={() => {
          setSubmitting(true);
          setErrorMessage(null);
          const result = submitPayment(guestInfo.email, hold.holdExpiresAt);
          setSubmitting(false);
          if (!result.ok) {
            setErrorMessage(result.error.message);
            return;
          }
          clearHold();
          const status = result.needsReview ? "needs_review" : "confirmed";
          const params = new URLSearchParams({
            code: result.reservationCode,
            date: businessDate,
            time: startTimeLabel,
            plan: plan.name,
            party: String(partySize),
            status,
          });
          router.push(`/confirmation?${params.toString()}`);
        }}
      >
        {submitting ? t("processing") : t("payButton")}
      </Button>
    </div>
  );
}
