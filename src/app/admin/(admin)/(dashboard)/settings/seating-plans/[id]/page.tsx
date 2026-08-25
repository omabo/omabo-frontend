import { notFound } from "next/navigation";

import { PermissionDenied } from "@/components/admin/permission-denied";
import { SeatingPlanEditor } from "@/components/admin/seating-plan-editor";
import { copy } from "@/lib/admin/copy";
import { countActiveReservationsForPlan, getCapacityGroup, getSeatingPlan, listSeatingPlans } from "@/lib/admin/mock-store";
import { getSession } from "@/lib/admin/session";

export default async function SeatingPlanEditPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (session?.role === "staff") return <PermissionDenied />;

  const { id } = await params;
  const plan = getSeatingPlan(id);
  if (!plan) notFound();
  const group = getCapacityGroup(plan.groupId);
  if (!group) notFound();

  const allPlans = listSeatingPlans();
  const siblingNames = allPlans.filter((p) => p.groupId === plan.groupId && p.id !== plan.id).map((p) => p.name);
  const otherPlans = allPlans
    .filter((p) => p.groupId !== plan.groupId)
    .map((p) => {
      const otherGroup = getCapacityGroup(p.groupId);
      return { id: p.id, name: p.name, groupId: p.groupId, totalCapacity: otherGroup?.totalCapacity ?? 0 };
    });

  return (
    <main className="mx-auto max-w-xl space-y-4 p-6">
      <h1 className="font-heading text-2xl font-semibold text-foreground">{plan.name}</h1>
      <p className="text-sm text-muted-foreground">{copy.seatingPlans.title}</p>
      <SeatingPlanEditor
        plan={plan}
        group={group}
        siblingNames={siblingNames}
        otherPlans={otherPlans}
        activeReservationCount={countActiveReservationsForPlan(plan.id)}
      />
    </main>
  );
}
