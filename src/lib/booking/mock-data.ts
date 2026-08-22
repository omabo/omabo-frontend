import type { ApiError } from "@/lib/errors";

// Phase 0: no backend yet. Every function here mirrors the shape/signature
// the real API is expected to have, so wiring it up later is a swap, not a rewrite.

export interface Restaurant {
  slug: string;
  name: string;
  timezone: string;
  currency: string;
  contactEmail: string;
  contactPhone: string;
  acceptingReservations: boolean;
  isPaused: boolean;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  minPartySize: number;
  maxPartySize: number;
}

export type SlotStatus = "open" | "almost-full" | "full";

export interface TimeSlot {
  id: string;
  businessDate: string;
  startTimeLabel: string;
  isoStartsAt: string;
  status: SlotStatus;
  /** Seats left for this slot. "almost-full" slots are deliberately small so a
   *  large party size can realistically trigger an inventory-conflict demo. */
  remainingCapacity: number;
}

const DEMO_RESTAURANTS: Record<string, Restaurant> = {
  default: {
    slug: "default",
    name: "omabo",
    timezone: "Asia/Tokyo",
    currency: "JPY",
    contactEmail: "hello@omabo-trattoria.example",
    contactPhone: "+81 3-1234-5678",
    acceptingReservations: true,
    isPaused: false,
  },
  "closed-demo": {
    slug: "closed-demo",
    name: "omabo",
    timezone: "Asia/Tokyo",
    currency: "JPY",
    contactEmail: "hello@omabo-trattoria.example",
    contactPhone: "+81 3-1234-5678",
    acceptingReservations: false,
    isPaused: false,
  },
  "paused-demo": {
    slug: "paused-demo",
    name: "omabo",
    timezone: "Asia/Tokyo",
    currency: "JPY",
    contactEmail: "hello@omabo-trattoria.example",
    contactPhone: "+81 3-1234-5678",
    acceptingReservations: true,
    isPaused: true,
  },
};

/**
 * `tenantSlug` comes from `x-tenant-slug` (set by proxy.ts from the subdomain).
 * `demoOverride` is a Phase 0-only escape hatch (?tenant=closed-demo) so the
 * closed/paused states can be reviewed without configuring local subdomains —
 * remove once a real tenant-resolution API exists.
 */
export function getRestaurant(tenantSlug: string | null, demoOverride?: string | null): Restaurant {
  const key = demoOverride ?? tenantSlug ?? "default";
  return DEMO_RESTAURANTS[key] ?? DEMO_RESTAURANTS.default;
}

export const PLANS: Plan[] = [
  {
    id: "lunch-set",
    name: "Lunch Set",
    description: "A light two-course lunch with a seasonal main and dessert.",
    priceCents: 280000,
    minPartySize: 1,
    maxPartySize: 6,
  },
  {
    id: "dinner-course",
    name: "Dinner Course",
    description: "Five courses built around the day's market produce.",
    priceCents: 680000,
    minPartySize: 2,
    maxPartySize: 8,
  },
  {
    id: "omakase-tasting",
    name: "Omakase Tasting",
    description: "Chef's full tasting menu, paired with wine on request.",
    priceCents: 1450000,
    minPartySize: 2,
    maxPartySize: 4,
  },
];

export function getPlan(planId: string): Plan | undefined {
  return PLANS.find((plan) => plan.id === planId);
}

const SLOT_TIMES = ["12:00", "12:30", "18:00", "18:30", "19:00", "19:30", "20:00"];

const BOOKABLE_DAYS = 21;

export function listBookableDates(restaurant: Restaurant): string[] {
  const dates: string[] = [];
  const now = new Date();
  for (let i = 1; i <= BOOKABLE_DAYS; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + i));
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function slotStatusFor(businessDate: string, time: string): SlotStatus {
  // Deterministic, not random, so the same demo slots are reproducibly
  // "full"/"almost-full" across reloads and are easy to point at in review.
  if (time === "19:00") return "full";
  if (time === "19:30") return "almost-full";
  const hash = hashString(`${businessDate}-${time}`);
  if (hash % 11 === 0) return "full";
  if (hash % 7 === 0) return "almost-full";
  return "open";
}

function remainingCapacityFor(status: SlotStatus): number {
  if (status === "full") return 0;
  if (status === "almost-full") return 2;
  return 12;
}

export function listTimeSlots(restaurant: Restaurant, businessDate: string): TimeSlot[] {
  return SLOT_TIMES.map((time) => {
    const [hour, minute] = time.split(":");
    const status = slotStatusFor(businessDate, time);
    return {
      id: `${businessDate}T${time}`,
      businessDate,
      startTimeLabel: time,
      isoStartsAt: toIsoInTimeZone(businessDate, hour, minute, restaurant.timezone),
      status,
      remainingCapacity: remainingCapacityFor(status),
    };
  });
}

export function getTimeSlot(restaurant: Restaurant, businessDate: string, slotId: string): TimeSlot | undefined {
  return listTimeSlots(restaurant, businessDate).find((slot) => slot.id === slotId);
}

// JST has no DST, so a fixed +09:00 offset is safe for this demo restaurant.
// A real implementation would use the restaurant's actual offset rules.
function toIsoInTimeZone(businessDate: string, hour: string, minute: string, timeZone: string): string {
  const offset = timeZone === "Asia/Tokyo" ? "+09:00" : "+00:00";
  return `${businessDate}T${hour}:${minute}:00${offset}`;
}

export interface HoldResult {
  ok: true;
  holdId: string;
  holdExpiresAt: number;
}

export interface ValidationFailure {
  ok: false;
  error: ApiError;
}

// Intentionally short (vs. a real TTL of ~10 minutes) so the countdown/expiry
// UI can be exercised by hand without a long wait. Source from the API later.
export const HOLD_TTL_MS = 90_000;

export function validateSelection(
  restaurant: Restaurant,
  businessDate: string,
  slotId: string,
  planId: string,
  partySize: number
): HoldResult | ValidationFailure {
  const slot = getTimeSlot(restaurant, businessDate, slotId);
  const plan = getPlan(planId);

  if (!slot || slot.status === "full") {
    return {
      ok: false,
      error: {
        code: "INVENTORY_CONFLICT",
        message: "The selected slot is now full. Please choose another time.",
      },
    };
  }

  if (partySize > slot.remainingCapacity) {
    return {
      ok: false,
      error: {
        code: "INVENTORY_CONFLICT",
        message: "The selected slot no longer has room for this party size. Please choose another time.",
      },
    };
  }

  if (!plan || partySize < plan.minPartySize || partySize > plan.maxPartySize) {
    return {
      ok: false,
      error: {
        code: "INVENTORY_CONFLICT",
        message: "This plan can no longer accommodate the selected party size.",
      },
    };
  }

  return {
    ok: true,
    holdId: `hold_${hashString(`${businessDate}-${slotId}-${planId}-${partySize}-${Date.now()}`)}`,
    holdExpiresAt: Date.now() + HOLD_TTL_MS,
  };
}

export interface PaymentResult {
  ok: true;
  reservationCode: string;
  needsReview: boolean;
}

export interface PaymentFailure {
  ok: false;
  error: ApiError;
}

/**
 * NullPaymentProvider stand-in: always "succeeds" in production terms, but
 * for this demo build a guest email is used as a sentinel so a reviewer can
 * deliberately exercise every downstream path:
 *  - contains "fail"     → generic payment decline (retry, hold kept)
 *  - contains "conflict" → inventory conflict at charge time (retry, hold kept)
 *  - contains "review"   → payment succeeds but inventory couldn't be confirmed
 *                          (LP-08 shows "pending review", needs_review queue)
 */
export function submitPayment(guestEmail: string, holdExpiresAt: number): PaymentResult | PaymentFailure {
  if (Date.now() > holdExpiresAt) {
    return {
      ok: false,
      error: { code: "INVENTORY_CONFLICT", message: "Your hold has expired." },
    };
  }
  const email = guestEmail.toLowerCase();
  if (email.includes("conflict")) {
    return {
      ok: false,
      error: { code: "INVENTORY_CONFLICT", message: "The selected slot is now full. Please choose another time." },
    };
  }
  if (email.includes("fail")) {
    return {
      ok: false,
      error: { code: "INTERNAL_ERROR", message: "Payment could not be processed. Please try again." },
    };
  }
  return {
    ok: true,
    reservationCode: `OMB-${hashString(guestEmail + Date.now()).toString(36).toUpperCase().slice(0, 6)}`,
    needsReview: email.includes("review"),
  };
}

export type ManagedReservationStatus = "confirmed" | "cancelled" | "superseded";

export interface ManagedReservation {
  token: string;
  code: string;
  status: ManagedReservationStatus;
  restaurant: Restaurant;
  businessDate: string;
  isoStartsAt: string;
  planName: string;
  partySize: number;
  guestName: string;
  cancellationDeadlinePassed: boolean;
  supersededByToken?: string;
  previousCode?: string;
}

const DEFAULT_RESTAURANT = DEMO_RESTAURANTS.default;

// Demo fixtures for LP-09. Any token not listed here renders the
// invalid/expired-token state (mirrors a 410 from the real API).
const DEMO_RESERVATIONS: Record<string, ManagedReservation> = {
  "demo-active": {
    token: "demo-active",
    code: "OMB-A1B2C3",
    status: "confirmed",
    restaurant: DEFAULT_RESTAURANT,
    businessDate: listBookableDates(DEFAULT_RESTAURANT)[2],
    isoStartsAt: toIsoInTimeZone(listBookableDates(DEFAULT_RESTAURANT)[2], "19", "30", DEFAULT_RESTAURANT.timezone),
    planName: "Dinner Course",
    partySize: 4,
    guestName: "Alex Rivera",
    cancellationDeadlinePassed: false,
  },
  "demo-cancelled": {
    token: "demo-cancelled",
    code: "OMB-C4D5E6",
    status: "cancelled",
    restaurant: DEFAULT_RESTAURANT,
    businessDate: listBookableDates(DEFAULT_RESTAURANT)[1],
    isoStartsAt: toIsoInTimeZone(listBookableDates(DEFAULT_RESTAURANT)[1], "18", "00", DEFAULT_RESTAURANT.timezone),
    planName: "Lunch Set",
    partySize: 2,
    guestName: "Jamie Chen",
    cancellationDeadlinePassed: false,
  },
  "demo-superseded": {
    token: "demo-superseded",
    code: "OMB-F7G8H9",
    status: "superseded",
    restaurant: DEFAULT_RESTAURANT,
    businessDate: listBookableDates(DEFAULT_RESTAURANT)[3],
    isoStartsAt: toIsoInTimeZone(listBookableDates(DEFAULT_RESTAURANT)[3], "12", "30", DEFAULT_RESTAURANT.timezone),
    planName: "Lunch Set",
    partySize: 3,
    guestName: "Sam Okafor",
    cancellationDeadlinePassed: false,
    supersededByToken: "demo-active",
  },
  "demo-deadline-passed": {
    token: "demo-deadline-passed",
    code: "OMB-J1K2L3",
    status: "confirmed",
    restaurant: DEFAULT_RESTAURANT,
    businessDate: listBookableDates(DEFAULT_RESTAURANT)[0],
    isoStartsAt: toIsoInTimeZone(listBookableDates(DEFAULT_RESTAURANT)[0], "20", "00", DEFAULT_RESTAURANT.timezone),
    planName: "Omakase Tasting",
    partySize: 2,
    guestName: "Priya Nair",
    cancellationDeadlinePassed: true,
  },
};

export function getManagedReservation(token: string): ManagedReservation | undefined {
  return DEMO_RESERVATIONS[token];
}

export interface ChangeResult {
  ok: true;
  reservation: ManagedReservation;
  codeChanged: boolean;
}

/** Party sizes above 8 deliberately simulate an inventory conflict on change, for review purposes. */
export function changeManagedReservation(
  reservation: ManagedReservation,
  newPartySize: number
): ChangeResult | ValidationFailure {
  if (newPartySize > 8) {
    return {
      ok: false,
      error: { code: "INVENTORY_CONFLICT", message: "That party size is no longer available for this slot." },
    };
  }
  const codeChanged = newPartySize !== reservation.partySize;
  const updated: ManagedReservation = {
    ...reservation,
    partySize: newPartySize,
    code: codeChanged ? `OMB-${hashString(reservation.token + newPartySize).toString(36).toUpperCase().slice(0, 6)}` : reservation.code,
    previousCode: codeChanged ? reservation.code : reservation.previousCode,
  };
  return { ok: true, reservation: updated, codeChanged };
}

export function cancelManagedReservation(reservation: ManagedReservation): ManagedReservation {
  return { ...reservation, status: "cancelled" };
}
