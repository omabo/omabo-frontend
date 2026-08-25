import { copy } from "@/lib/admin/copy";
import { getCapacityGroup, minutesToTime, timeToMinutes } from "@/lib/admin/mock-store";
import type { Reservation, RestaurantTable } from "@/lib/admin/mock-store";

const SLOT_MINUTES = 30;
const DEFAULT_FIXED_TURN_MINUTES = 90;

function occupancyMinutes(r: Reservation): { start: number; end: number } {
  const start = timeToMinutes(r.startTimeLabel);
  const group = r.groupId ? getCapacityGroup(r.groupId) : undefined;
  const turnMinutes = group?.timeModel.type === "flexible" ? group.timeModel.turnTimeMinutes : DEFAULT_FIXED_TURN_MINUTES;
  return { start, end: start + turnMinutes };
}

export function TableTimeline({ tables, reservations }: { tables: RestaurantTable[]; reservations: Reservation[] }) {
  const activeTables = tables.filter((t) => t.active);

  if (activeTables.length === 0) {
    return <p className="text-sm text-muted-foreground">{copy.calendarTable.timelineEmpty}</p>;
  }

  const assigned = reservations.filter(
    (r) => r.tableId && (r.status === "confirmed" || r.status === "needs_review")
  );

  if (assigned.length === 0) {
    return (
      <div className="space-y-2">
        <h2 className="text-sm font-medium text-foreground">{copy.calendarTable.timelineTitle}</h2>
        <p className="text-sm text-muted-foreground">{copy.calendar.noSlotsGenerated}</p>
      </div>
    );
  }

  const occupancies = assigned.map((r) => ({ reservation: r, ...occupancyMinutes(r) }));
  const rangeStart = Math.min(...occupancies.map((o) => o.start));
  const rangeEnd = Math.max(...occupancies.map((o) => o.end));
  const gridStart = Math.floor(rangeStart / SLOT_MINUTES) * SLOT_MINUTES;
  const gridEnd = Math.ceil(rangeEnd / SLOT_MINUTES) * SLOT_MINUTES;
  const slotCount = Math.max(1, (gridEnd - gridStart) / SLOT_MINUTES);
  const slots = Array.from({ length: slotCount }, (_, i) => gridStart + i * SLOT_MINUTES);

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-medium text-foreground">{copy.calendarTable.timelineTitle}</h2>
      <div className="overflow-x-auto rounded-lg border border-border">
        <div className="grid" style={{ gridTemplateColumns: `8rem repeat(${slotCount}, minmax(2.5rem, 1fr))` }}>
          <div className="border-b border-border bg-muted/50 p-2 text-xs font-medium text-muted-foreground">
            {copy.calendarTable.columnHeading}
          </div>
          {slots.map((m) => (
            <div
              key={m}
              className="border-b border-l border-border bg-muted/50 p-1 text-center text-[11px] tabular-nums text-muted-foreground"
            >
              {minutesToTime(m)}
            </div>
          ))}
          {activeTables.map((table) => {
            const tableOccupancies = occupancies.filter((o) => o.reservation.tableId === table.id);
            return (
              <div key={table.id} className="contents">
                <div className="border-b border-border p-2 text-sm text-foreground">{table.name}</div>
                {slots.map((m) => {
                  const occupied = tableOccupancies.some((o) => m < o.end && m + SLOT_MINUTES > o.start);
                  return (
                    <div
                      key={m}
                      className={
                        occupied
                          ? "border-b border-l border-border bg-primary/20 p-1"
                          : "border-b border-l border-border p-1"
                      }
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{copy.calendarTable.timelineNote}</p>
    </div>
  );
}
