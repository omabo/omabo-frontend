import Link from "next/link";

import { cn } from "@/lib/utils";
import { copy } from "@/lib/admin/copy";

const VIEWS = [
  { key: "month", label: copy.calendar.viewMonth },
  { key: "week", label: copy.calendar.viewWeek },
  { key: "day", label: copy.calendar.viewDay },
] as const;

export function ViewSwitcher({ view, date }: { view: string; date: string }) {
  return (
    <div className="inline-flex rounded-md border border-border p-0.5">
      {VIEWS.map((v) => (
        <Link
          key={v.key}
          href={`/reservations?view=${v.key}&date=${date}`}
          className={cn(
            "rounded px-3 py-1 text-sm transition-colors",
            view === v.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {v.label}
        </Link>
      ))}
    </div>
  );
}
