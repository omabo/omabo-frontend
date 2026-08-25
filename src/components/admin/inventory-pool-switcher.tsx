import Link from "next/link";

import { cn } from "@/lib/utils";
import { groupDisplayLabel, type CapacityGroup } from "@/lib/admin/mock-store";

export function InventoryPoolSwitcher({ groups, activeGroupId, date }: { groups: CapacityGroup[]; activeGroupId: string; date: string }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {groups.map((group) => (
        <Link
          key={group.id}
          href={`/inventory?pool=${group.id}&date=${date}`}
          className={cn(
            "rounded-md border px-3 py-1.5 text-sm transition-colors",
            group.id === activeGroupId ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-accent"
          )}
        >
          {groupDisplayLabel(group.id)}
        </Link>
      ))}
    </div>
  );
}
