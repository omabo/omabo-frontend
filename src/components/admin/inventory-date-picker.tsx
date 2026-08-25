import Link from "next/link";

import { cn } from "@/lib/utils";
import { dayOfMonth } from "@/lib/admin/date-utils";

export function InventoryDatePicker({ dates, activeDate, groupId }: { dates: string[]; activeDate: string; groupId: string }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1">
      {dates.map((d) => (
        <Link
          key={d}
          href={`/inventory?pool=${groupId}&date=${d}`}
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-md border text-sm transition-colors",
            d === activeDate ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-accent"
          )}
        >
          {dayOfMonth(d)}
        </Link>
      ))}
    </div>
  );
}
