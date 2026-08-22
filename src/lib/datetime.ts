import { formatInTimeZone as formatInTimeZoneImpl } from "date-fns-tz";

/**
 * Formats an ISO timestamp in the restaurant's timezone, never the browser's.
 * A guest booking from abroad must see the restaurant's local time, not their own.
 */
export function formatInTimeZone(isoString: string, timeZone: string, pattern: string): string {
  return formatInTimeZoneImpl(new Date(isoString), timeZone, pattern);
}

/**
 * `business_date` (YYYY-MM-DD) is a label, not a calendar day in any timezone.
 * A restaurant open past midnight attributes a 26:00 slot to the previous
 * business day, so this must stay a string and never round-trip through Date.
 */
export function formatBusinessDate(businessDate: string, pattern: "long" | "short" = "long"): string {
  const [year, month, day] = businessDate.split("-").map(Number);
  const utcNoon = new Date(Date.UTC(year, month - 1, day, 12));
  return formatInTimeZoneImpl(utcNoon, "UTC", pattern === "long" ? "EEEE, MMMM d, yyyy" : "MMM d, yyyy");
}

export function formatCountdown(msRemaining: number): string {
  const totalSeconds = Math.max(0, Math.floor(msRemaining / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
