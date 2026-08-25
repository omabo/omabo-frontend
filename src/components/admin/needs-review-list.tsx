"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { copy } from "@/lib/admin/copy";
import { formatFullDateLabel } from "@/lib/admin/date-utils";
import { resolveNeedsReview } from "@/lib/admin/actions";
import type { Reservation } from "@/lib/admin/mock-store";

const REASON_LABEL = {
  inventory_conflict: copy.needsReview.reasonInventoryConflict,
  low_confidence: copy.needsReview.reasonLowConfidence,
  plan_unresolved: copy.needsReview.reasonPlanUnresolved,
};

export function NeedsReviewList({ reservations }: { reservations: Reservation[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (reservations.length === 0) {
    return <p className="text-sm text-muted-foreground">{copy.needsReview.empty}</p>;
  }

  return (
    <div className="space-y-3">
      {reservations.map((r) => (
        <Card key={r.id}>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <Link href={`/reservations/${r.id}`} className="font-medium hover:underline">
                {formatFullDateLabel(r.businessDate)} {r.startTimeLabel} · {r.guestName}
              </Link>
              {r.needsReviewReason ? <Badge variant="destructive">{REASON_LABEL[r.needsReviewReason]}</Badge> : null}
            </div>
            <p className="text-muted-foreground">
              {r.planName || "(未確定)"} · {copy.common.guests(r.partySize)}
            </p>
            {r.needsReviewDetail?.rawEmail ? (
              <div>
                <p className="text-xs font-medium text-muted-foreground">{copy.needsReview.rawEmailLabel}</p>
                <pre className="mt-1 whitespace-pre-wrap rounded-md bg-muted p-2 text-xs">{r.needsReviewDetail.rawEmail}</pre>
              </div>
            ) : null}
            {r.needsReviewDetail?.candidatePlanNames ? (
              <p className="text-xs text-muted-foreground">
                {copy.needsReview.candidatePlansLabel}: {r.needsReviewDetail.candidatePlanNames.join(" / ")}
              </p>
            ) : null}
            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await resolveNeedsReview(r.id, "confirm");
                    router.refresh();
                  })
                }
              >
                {copy.needsReview.confirm}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await resolveNeedsReview(r.id, "reject");
                    router.refresh();
                  })
                }
              >
                {copy.needsReview.reject}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
