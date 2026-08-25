import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ReservationDetailActions } from "@/components/admin/reservation-detail-actions";
import { copy } from "@/lib/admin/copy";
import { formatFullDateLabel } from "@/lib/admin/date-utils";
import { getReservation } from "@/lib/admin/mock-store";
import { getSession } from "@/lib/admin/session";

const REASON_LABEL = {
  inventory_conflict: copy.reservationDetail.reasonInventoryConflict,
  low_confidence: copy.reservationDetail.reasonLowConfidence,
  plan_unresolved: copy.reservationDetail.reasonPlanUnresolved,
};

export default async function ReservationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reservation = getReservation(id);
  if (!reservation) notFound();

  const session = await getSession();
  const role = session?.role ?? "staff";
  const maskContact = role === "staff";

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-6">
      <h1 className="font-heading text-2xl font-semibold text-foreground">{copy.reservationDetail.title}</h1>

      {reservation.status === "superseded" && reservation.supersededByReservationId ? (
        <div className="rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm">
          <p className="font-medium">{copy.reservationDetail.superseded}</p>
          <Link href={`/reservations/${reservation.supersededByReservationId}`} className="underline underline-offset-2">
            {copy.reservationDetail.viewNew}
          </Link>
        </div>
      ) : null}

      {reservation.previousReservationId ? (
        <Link
          href={`/reservations/${reservation.previousReservationId}`}
          className="block text-sm text-muted-foreground underline underline-offset-2"
        >
          {copy.reservationDetail.hasPrevious}
        </Link>
      ) : null}

      <Card>
        <CardContent className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">予約番号</span>
            <span className="font-mono">{reservation.code}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">日時</span>
            <span>
              {formatFullDateLabel(reservation.businessDate)} {reservation.startTimeLabel}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">プラン</span>
            <span>{reservation.planName || "(未確定)"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">人数</span>
            <span>{copy.common.guests(reservation.partySize)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">お客様</span>
            <span>{reservation.guestName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">連絡先</span>
            <span>{maskContact ? "***(マスク済み)" : `${reservation.guestEmail} / ${reservation.guestPhone}`}</span>
          </div>
          {maskContact ? <p className="text-xs text-muted-foreground">{copy.reservationDetail.contactMasked}</p> : null}
          {reservation.notes ? (
            <div className="flex justify-between">
              <span className="text-muted-foreground">備考</span>
              <span>{reservation.notes}</span>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {reservation.status === "needs_review" && reservation.needsReviewReason ? (
        <Card>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">{copy.reservationDetail.needsReviewReasonLabel}</span>
              <Badge variant="destructive">{REASON_LABEL[reservation.needsReviewReason]}</Badge>
            </div>
            {reservation.needsReviewDetail?.rawEmail ? (
              <pre className="whitespace-pre-wrap rounded-md bg-muted p-3 text-xs">{reservation.needsReviewDetail.rawEmail}</pre>
            ) : null}
            {reservation.needsReviewDetail?.candidatePlanNames ? (
              <p className="text-xs text-muted-foreground">
                候補: {reservation.needsReviewDetail.candidatePlanNames.join(" / ")}
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <ReservationDetailActions reservation={reservation} role={role} />
    </main>
  );
}
