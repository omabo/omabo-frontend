"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorBanner } from "@/components/booking/error-banner";

export function PartySizeChangeForm({
  currentPartySize,
  error,
  onSubmit,
  onCancel,
}: {
  currentPartySize: number;
  error: string | null;
  onSubmit: (partySize: number) => void;
  onCancel: () => void;
}) {
  const t = useTranslations("booking.manage");
  const [value, setValue] = useState(String(currentPartySize));

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(Number(value));
      }}
    >
      {error ? <ErrorBanner message={error} /> : null}
      <p className="text-xs text-muted-foreground">{t("changeReassurance")}</p>
      <div className="space-y-1.5">
        <Label htmlFor="new-party-size">{t("partySizeLabel")}</Label>
        <Input
          id="new-party-size"
          type="number"
          min={1}
          max={20}
          required
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit">{t("saveChanges")}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("cancelEdit")}
        </Button>
      </div>
    </form>
  );
}
