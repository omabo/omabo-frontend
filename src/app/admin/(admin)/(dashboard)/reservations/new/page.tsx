import { ManualEntryForm } from "@/components/admin/manual-entry-form";
import { copy } from "@/lib/admin/copy";
import {
  isFixedDayGenerated,
  isFlexibleDayGenerated,
  listBusinessDates,
  listCapacityGroups,
  listSeatingPlans,
} from "@/lib/admin/mock-store";

export default async function ManualEntryPage() {
  const businessDates = listBusinessDates();
  const plans = listSeatingPlans().filter((p) => p.active);
  const groups = listCapacityGroups();

  const generatedDatesByGroup: Record<string, string[]> = {};
  for (const group of groups) {
    generatedDatesByGroup[group.id] = businessDates.filter((d) =>
      group.timeModel.type === "fixed" ? isFixedDayGenerated(group.id, d) : isFlexibleDayGenerated(group.id, d)
    );
  }

  return (
    <main className="mx-auto max-w-xl space-y-4 p-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold text-foreground">{copy.manualEntry.title}</h1>
        <p className="text-sm text-muted-foreground">{copy.manualEntry.subtitle}</p>
      </div>
      <ManualEntryForm businessDates={businessDates} plans={plans} groups={groups} generatedDatesByGroup={generatedDatesByGroup} />
    </main>
  );
}
