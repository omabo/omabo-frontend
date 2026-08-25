import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PermissionDenied } from "@/components/admin/permission-denied";
import { SeatingPlanCard } from "@/components/admin/seating-plan-card";
import { copy } from "@/lib/admin/copy";
import { countActiveReservationsForPlan, getCapacityGroup, listSeatingPlans } from "@/lib/admin/mock-store";
import { getSession } from "@/lib/admin/session";

export default async function SeatingPlansPage() {
  const session = await getSession();
  if (session?.role === "staff") return <PermissionDenied />;

  const plans = listSeatingPlans();

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold text-foreground">{copy.seatingPlans.title}</h1>
        <Button size="sm" render={<Link href="/settings/seating-plans/new" />} nativeButton={false}>
          {copy.seatingPlans.create}
        </Button>
      </div>
      <div className="space-y-4">
        {plans.map((plan) => {
          const group = getCapacityGroup(plan.groupId);
          if (!group) return null;
          const siblingNames = plans.filter((p) => p.groupId === plan.groupId && p.id !== plan.id).map((p) => p.name);
          return (
            <SeatingPlanCard
              key={plan.id}
              plan={plan}
              group={group}
              siblingNames={siblingNames}
              activeReservationCount={countActiveReservationsForPlan(plan.id)}
            />
          );
        })}
      </div>
    </main>
  );
}
