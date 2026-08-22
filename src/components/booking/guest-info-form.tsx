"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { HoldCountdown } from "@/components/booking/hold-countdown";
import { useBookingFlow } from "@/lib/booking/flow-context";
import { validateSelection, type Restaurant } from "@/lib/booking/mock-data";

export function GuestInfoForm({
  restaurant,
  businessDate,
  slotId,
  planId,
  partySize,
}: {
  restaurant: Restaurant;
  businessDate: string;
  slotId: string;
  planId: string;
  partySize: number;
}) {
  const router = useRouter();
  const t = useTranslations("booking.guestInfo");
  const { guestInfo, setGuestInfo, hold, startHold } = useBookingFlow();
  const [name, setName] = useState(guestInfo?.name ?? "");
  const [email, setEmail] = useState(guestInfo?.email ?? "");
  const [phone, setPhone] = useState(guestInfo?.phone ?? "");
  const [notes, setNotes] = useState(guestInfo?.notes ?? "");

  useEffect(() => {
    if (hold) return;
    const result = validateSelection(restaurant, businessDate, slotId, planId, partySize);
    if (result.ok) {
      startHold({ holdId: result.holdId, holdExpiresAt: result.holdExpiresAt });
    } else {
      router.replace(`/plan?date=${businessDate}&time=${slotId}&error=slot_full`);
    }
    // Only re-run if the selection itself changes; `hold`/`startHold` change every tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessDate, slotId, planId, partySize, restaurant]);

  if (!hold) {
    return <p className="text-sm text-muted-foreground">{t("checkingAvailability")}</p>;
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        setGuestInfo({ name, email, phone, notes });
        router.push(`/payment?date=${businessDate}&time=${slotId}&plan=${planId}&party=${partySize}`);
      }}
    >
      <HoldCountdown />

      <div className="space-y-1.5">
        <Label htmlFor="guest-name">{t("nameLabel")}</Label>
        <Input id="guest-name" required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="guest-email">{t("emailLabel")}</Label>
        <Input
          id="guest-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <p className="text-xs text-muted-foreground">{t("demoHint")}</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="guest-phone">{t("phoneLabel")}</Label>
        <Input
          id="guest-phone"
          type="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+1 555 123 4567"
          autoComplete="tel"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="guest-notes">{t("notesLabel")}</Label>
        <Textarea id="guest-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("notesPlaceholder")} />
      </div>

      <Button type="submit" size="lg" className="h-11 w-full">
        {t("continue")}
      </Button>
    </form>
  );
}
