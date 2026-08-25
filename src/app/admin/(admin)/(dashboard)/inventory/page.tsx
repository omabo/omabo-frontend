import { InventoryDatePicker } from "@/components/admin/inventory-date-picker";
import { InventoryPoolSwitcher } from "@/components/admin/inventory-pool-switcher";
import { InventoryTable } from "@/components/admin/inventory-table";
import { copy } from "@/lib/admin/copy";
import { formatFullDateLabel } from "@/lib/admin/date-utils";
import {
  isFixedDayGenerated,
  isFlexibleDayGenerated,
  isFlexibleDayStopSell,
  listBusinessDates,
  listCapacityGroups,
  listFlexibleReservationsForDate,
  listInventoryForDate,
  todaysBusinessDate,
} from "@/lib/admin/mock-store";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ pool?: string; date?: string }>;
}) {
  const { pool: groupParam, date } = await searchParams;
  const groups = listCapacityGroups();
  const activeGroup = groups.find((g) => g.id === groupParam) ?? groups[0];
  const dates = listBusinessDates();
  const activeDate = date && dates.includes(date) ? date : todaysBusinessDate();

  if (!activeGroup) {
    return (
      <main className="mx-auto max-w-3xl space-y-4 p-6">
        <h1 className="font-heading text-2xl font-semibold text-foreground">{copy.inventory.title}</h1>
        <p className="text-sm text-muted-foreground">{copy.calendar.noSeatingPlan}</p>
      </main>
    );
  }

  const generated =
    activeGroup.timeModel.type === "fixed"
      ? isFixedDayGenerated(activeGroup.id, activeDate)
      : isFlexibleDayGenerated(activeGroup.id, activeDate);

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-6">
      <h1 className="font-heading text-2xl font-semibold text-foreground">{copy.inventory.title}</h1>
      <InventoryPoolSwitcher groups={groups} activeGroupId={activeGroup.id} date={activeDate} />
      <InventoryDatePicker dates={dates} activeDate={activeDate} groupId={activeGroup.id} />
      <p className="text-sm text-muted-foreground">{formatFullDateLabel(activeDate)}</p>
      <InventoryTable
        group={activeGroup}
        businessDate={activeDate}
        generated={generated}
        fixedSlots={activeGroup.timeModel.type === "fixed" ? listInventoryForDate(activeGroup.id, activeDate) : []}
        flexibleReservations={
          activeGroup.timeModel.type === "flexible" ? listFlexibleReservationsForDate(activeGroup.id, activeDate) : []
        }
        flexibleStopSell={activeGroup.timeModel.type === "flexible" ? isFlexibleDayStopSell(activeGroup.id, activeDate) : false}
      />
    </main>
  );
}
