"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ErrorBanner } from "@/components/booking/error-banner";
import { formatBusinessDate } from "@/lib/datetime";
import {
  cancelManagedReservation,
  changeManagedReservation,
  type ManagedReservation,
} from "@/lib/booking/mock-data";
import { PartySizeChangeForm } from "@/components/booking/manage/party-size-change-form";

export function ManageReservationView({ reservation: initial }: { reservation: ManagedReservation }) {
  const t = useTranslations("booking.manage");
  const [reservation, setReservation] = useState(initial);
  const [mode, setMode] = useState<"view" | "editing" | "confirmingCancel">("view");
  const [changeError, setChangeError] = useState<string | null>(null);
  const [codeChangedFrom, setCodeChangedFrom] = useState<string | null>(null);

  if (reservation.status === "superseded") {
    return (
      <div className="space-y-4">
        <ErrorBanner message={t("supersededBody")} className="border-border bg-muted/50 text-foreground" />
        {reservation.supersededByToken ? (
          <Button render={<Link href={`/r/${reservation.supersededByToken}`} />} nativeButton={false}>
            {t("viewNew")}
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {codeChangedFrom ? (
        <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-foreground">
          <p className="font-medium">{t("codeChangedTitle")}</p>
          <p className="text-muted-foreground">{t("codeChangedBody", { oldCode: codeChangedFrom, newCode: reservation.code })}</p>
        </div>
      ) : null}

      {reservation.status === "cancelled" ? (
        <Badge variant="outline">{t("statusCancelled")}</Badge>
      ) : null}

      <Card>
        <CardContent className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("codeLabel")}</span>
            <span className="font-mono font-medium">{reservation.code}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{formatBusinessDate(reservation.businessDate)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{reservation.planName}</span>
            <span>{t("partyCount", { count: reservation.partySize })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("guestLabel")}</span>
            <span>{reservation.guestName}</span>
          </div>
        </CardContent>
      </Card>

      {reservation.status === "cancelled" ? null : mode === "editing" ? (
        <PartySizeChangeForm
          currentPartySize={reservation.partySize}
          error={changeError}
          onCancel={() => {
            setMode("view");
            setChangeError(null);
          }}
          onSubmit={(newPartySize) => {
            const result = changeManagedReservation(reservation, newPartySize);
            if (!result.ok) {
              setChangeError(result.error.message);
              return;
            }
            if (result.codeChanged) {
              setCodeChangedFrom(reservation.code);
            }
            setReservation(result.reservation);
            setChangeError(null);
            setMode("view");
          }}
        />
      ) : mode === "confirmingCancel" ? (
        <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-4 text-sm">
          <p>{t("cancelConfirmBody")}</p>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={() => {
                setReservation(cancelManagedReservation(reservation));
                setMode("view");
              }}
            >
              {t("confirmCancel")}
            </Button>
            <Button variant="outline" onClick={() => setMode("view")}>
              {t("keepReservation")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setMode("editing")}>
            {t("changePartySize")}
          </Button>
          {reservation.cancellationDeadlinePassed ? (
            <div className="w-full space-y-1">
              <Button variant="outline" disabled>
                {t("cancelButton")}
              </Button>
              <p className="text-xs text-muted-foreground">{t("deadlinePassedNote")}</p>
            </div>
          ) : (
            <Button variant="outline" className="border-destructive/30 text-destructive" onClick={() => setMode("confirmingCancel")}>
              {t("cancelButton")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
