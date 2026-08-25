import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { copy } from "@/lib/admin/copy";
import type { CapacityGroup, SeatingPlan } from "@/lib/admin/mock-store";

// List-page summary only — no editing here. All settings live on the
// per-plan edit screen (/settings/seating-plans/[id]) so the list stays a
// quick "what plans exist" overview instead of an editor.
export function SeatingPlanCard({
  plan,
  group,
  siblingNames,
  activeReservationCount,
}: {
  plan: SeatingPlan;
  group: CapacityGroup;
  siblingNames: string[];
  activeReservationCount: number;
}) {
  const isShared = siblingNames.length > 0;

  return (
    <Card className={!plan.active ? "opacity-60" : undefined}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            {plan.name}
            {!plan.active ? <Badge variant="outline">無効</Badge> : null}
          </span>
          <Button
            size="sm"
            variant="outline"
            render={<Link href={`/settings/seating-plans/${plan.id}`} />}
            nativeButton={false}
          >
            {copy.seatingPlans.edit}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-sm text-muted-foreground">
        <p>{copy.seatingPlans.currentUsage(activeReservationCount)}</p>
        <p>
          {copy.seatingPlans.partyRange}: {plan.minPartySize}〜{plan.maxPartySize}名
        </p>
        <p className="text-foreground">
          {isShared ? copy.seatingPlans.sharedLabel(siblingNames.join("・")) : copy.seatingPlans.dedicatedLabel(group.totalCapacity)}
        </p>
      </CardContent>
    </Card>
  );
}
