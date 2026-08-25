import { CreatePlanForm } from "@/components/admin/create-plan-form";
import { copy } from "@/lib/admin/copy";
import { getCapacityGroup, listSeatingPlans } from "@/lib/admin/mock-store";

export default async function CreateSeatingPlanPage() {
  const plans = listSeatingPlans();
  const existingPlans = plans.map((p) => {
    const group = getCapacityGroup(p.groupId);
    return { id: p.id, name: p.name, groupId: p.groupId, totalCapacity: group?.totalCapacity ?? 0 };
  });

  return (
    <main className="mx-auto max-w-xl space-y-4 p-6">
      <h1 className="font-heading text-2xl font-semibold text-foreground">{copy.createPlan.title}</h1>
      <CreatePlanForm existingPlans={existingPlans} />
    </main>
  );
}
