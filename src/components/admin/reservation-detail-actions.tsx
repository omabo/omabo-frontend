"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { copy } from "@/lib/admin/copy";
import { cancelReservation, resolveNeedsReview } from "@/lib/admin/actions";
import type { AdminRole } from "@/lib/admin/session-constants";
import type { Reservation } from "@/lib/admin/mock-store";

export function ReservationDetailActions({ reservation, role }: { reservation: Reservation; role: AdminRole }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (reservation.status === "cancelled") {
    return message ? <p className="text-sm text-muted-foreground">{message}</p> : null;
  }

  const canReview = reservation.status === "needs_review";

  return (
    <div className="space-y-3">
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

      {canReview ? (
        <div className="flex gap-2">
          <Button
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await resolveNeedsReview(reservation.id, "confirm");
                router.refresh();
              })
            }
          >
            {copy.reservationDetail.confirm}
          </Button>
          <Button
            variant="outline"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await resolveNeedsReview(reservation.id, "reject");
                router.refresh();
              })
            }
          >
            {copy.reservationDetail.reject}
          </Button>
        </div>
      ) : confirmingCancel ? (
        <div className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <p className="text-sm">{copy.reservationDetail.cancelConfirm}</p>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await cancelReservation(reservation.id);
                  if (result.ok && result.refundPending) {
                    setMessage(copy.reservationDetail.refundPendingNotice);
                  }
                  setConfirmingCancel(false);
                  router.refresh();
                })
              }
            >
              {copy.reservationDetail.cancel}
            </Button>
            <Button variant="outline" onClick={() => setConfirmingCancel(false)}>
              {copy.common.back}
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" className="border-destructive/30 text-destructive" onClick={() => setConfirmingCancel(true)}>
          {copy.reservationDetail.cancel}
        </Button>
      )}
    </div>
  );
}
