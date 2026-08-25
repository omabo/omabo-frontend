function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toDateStr(d: Date): string {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

function parse(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function addDaysToDateStr(dateStr: string, n: number): string {
  const d = parse(dateStr);
  d.setUTCDate(d.getUTCDate() + n);
  return toDateStr(d);
}

export function startOfWeek(dateStr: string): string {
  const d = parse(dateStr);
  d.setUTCDate(d.getUTCDate() - d.getUTCDay());
  return toDateStr(d);
}

/** The date range actually rendered by a month grid, including the leading/trailing
 *  days from adjacent months — this is what should be queried, not just the month itself. */
export function monthGridRange(dateStr: string): { from: string; to: string; monthLabel: string; days: string[] } {
  const [year, month] = dateStr.split("-").map(Number);
  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const lastOfMonth = new Date(Date.UTC(year, month, 0));
  const from = toDateStr(firstOfMonth);
  const gridStart = startOfWeek(from);
  const to = toDateStr(lastOfMonth);
  const gridEndBase = parse(to);
  gridEndBase.setUTCDate(gridEndBase.getUTCDate() + (6 - gridEndBase.getUTCDay()));
  const gridEnd = toDateStr(gridEndBase);

  const days: string[] = [];
  let cursor = gridStart;
  while (cursor <= gridEnd) {
    days.push(cursor);
    cursor = addDaysToDateStr(cursor, 1);
  }

  const monthLabel = firstOfMonth.toLocaleDateString("ja-JP", { year: "numeric", month: "long", timeZone: "UTC" });

  return { from: gridStart, to: gridEnd, monthLabel, days };
}

export function weekRange(dateStr: string): { from: string; to: string; days: string[] } {
  const from = startOfWeek(dateStr);
  const days = Array.from({ length: 7 }, (_, i) => addDaysToDateStr(from, i));
  return { from, to: days[6], days };
}

export function formatDayLabel(dateStr: string): string {
  return parse(dateStr).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric", weekday: "short", timeZone: "UTC" });
}

export function formatFullDateLabel(dateStr: string): string {
  return parse(dateStr).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "short", timeZone: "UTC" });
}

export function isSameMonth(dateStr: string, referenceMonth: string): boolean {
  return dateStr.slice(0, 7) === referenceMonth.slice(0, 7);
}

export function dayOfMonth(dateStr: string): number {
  return Number(dateStr.slice(-2));
}
