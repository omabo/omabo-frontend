// Phase 0: no backend yet. This is an in-memory "database" for the admin
// screens, intentionally separate from src/lib/booking/mock-data.ts (admin
// and booking don't share data any more than they share components — see
// docs/ui-conventions.md). Resets whenever the dev server process restarts.

export type SourceChannel = "web" | "phone" | "ota" | "walk-in";
export type ReservationStatus = "confirmed" | "cancelled" | "superseded" | "needs_review";
export type NeedsReviewReason = "inventory_conflict" | "low_confidence" | "plan_unresolved";

export interface Reservation {
  id: string;
  code: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  partySize: number;
  planId: string;
  planName: string;
  groupId?: string;
  /** Manual, view/edit-only assignment for the floor — never read by
   *  availability checks. Set via the day-view calendar's table column. */
  tableId?: string;
  businessDate: string;
  startTimeLabel: string;
  isoStartsAt: string;
  sourceChannel: SourceChannel;
  status: ReservationStatus;
  needsReviewReason?: NeedsReviewReason;
  needsReviewDetail?: { rawEmail?: string; candidatePlanNames?: string[] };
  previousReservationId?: string;
  supersededByReservationId?: string;
  refundPending?: boolean;
  createdVia: "lp" | "manual";
  notes?: string;
}

export interface SeatingPlan {
  id: string;
  name: string;
  /** Every plan belongs to a capacity group — a group with 1 plan behaves
   *  like the old "dedicated" type, a group with 2+ plans is "shared".
   *  Groups have no user-facing name/identity of their own (see mock-data
   *  design notes) — they only ever exist implicitly through plans. */
  groupId: string;
  minPartySize: number;
  maxPartySize: number;
  active: boolean;
}

export type TimeModel =
  | { type: "fixed"; times: string[] }
  | { type: "flexible"; startTime: string; endTime: string; intervalMinutes: number; turnTimeMinutes: number };

/** Never shown to the user as a named, independently-managed thing — always
 *  presented through the plan(s) that use it ("専用" for 1 plan, "○○と共有"
 *  for 2+). No `name` field on purpose. */
export interface CapacityGroup {
  id: string;
  totalCapacity: number;
  timeModel: TimeModel;
}

/**
 * Purely an operational/visualization layer (which physical table a
 * confirmed reservation sits at) — completely separate from CapacityGroup.
 * Never consulted by availability checks; assignment has no validation
 * against overlaps, by design (the floor staff catch conflicts visually
 * on the day-view timeline instead of the system blocking them).
 */
export interface RestaurantTable {
  id: string;
  name: string;
  seatCount: number;
  active: boolean;
}

export type AdminUserRole = "staff" | "admin" | "super_admin";

// Deliberately separate from the email-pattern role guess in session.ts
// (there's no real user database yet either place) — this is just the
// staff directory shown on ADM-12, not what actually gates login.
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminUserRole;
  active: boolean;
}

export interface BusinessHours {
  day: "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
  open: string;
  close: string;
  closed: boolean;
}

export interface RestaurantSettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  timezone: string;
  acceptingReservations: boolean;
  businessHours: BusinessHours[];
}

export interface LpCustomization {
  displayName: string;
  welcomeMessage: string;
  accentColorHex: string;
}

export interface NotificationSettings {
  newReservation: boolean;
  cancellation: boolean;
  needsReview: boolean;
  dailySummary: boolean;
}

export interface AuditLogEntry {
  id: string;
  at: string; // ISO timestamp
  actorEmail: string;
  action: string;
  detail?: string;
}

/** Only used for "fixed" groups — one row per (group, date, time). */
export interface InventorySlot {
  groupId: string;
  businessDate: string;
  startTimeLabel: string;
  bookedCount: number;
  heldCount: number;
  stopSell: boolean;
  generated: boolean;
}

const GENERATED_DAYS = 10; // future dates beyond this are "not yet generated"
const TOTAL_DAYS = 21;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function addDays(offset: number): string {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + offset));
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${pad(h)}:${pad(m)}`;
}

function intervalsOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

// --- Seed data -----------------------------------------------------------

let capacityGroups: CapacityGroup[] = [
  {
    id: "group_default",
    totalCapacity: 20,
    timeModel: { type: "fixed", times: ["12:00", "12:30"] },
  },
  {
    id: "group_dinner_flex",
    totalCapacity: 16,
    timeModel: { type: "flexible", startTime: "17:30", endTime: "21:00", intervalMinutes: 15, turnTimeMinutes: 120 },
  },
  {
    id: "group_omakase",
    totalCapacity: 4,
    timeModel: { type: "fixed", times: ["18:00", "20:30"] },
  },
];

let seatingPlans: SeatingPlan[] = [
  { id: "lunch-set", name: "ランチセット", groupId: "group_default", minPartySize: 1, maxPartySize: 6, active: true },
  { id: "light-lunch", name: "ライトランチ", groupId: "group_default", minPartySize: 1, maxPartySize: 4, active: true },
  { id: "dinner-course", name: "ディナーコース", groupId: "group_dinner_flex", minPartySize: 2, maxPartySize: 8, active: true },
  { id: "omakase-tasting", name: "おまかせ", groupId: "group_omakase", minPartySize: 2, maxPartySize: 4, active: true },
];

let restaurantTables: RestaurantTable[] = [
  { id: "table_1", name: "テーブル1", seatCount: 2, active: true },
  { id: "table_2", name: "テーブル2", seatCount: 2, active: true },
  { id: "table_3", name: "テーブル3", seatCount: 4, active: true },
  { id: "table_4", name: "テーブル4", seatCount: 4, active: true },
  { id: "table_5", name: "窓際テーブル", seatCount: 6, active: true },
  { id: "table_6", name: "カウンター", seatCount: 4, active: true },
];

let adminUsers: AdminUser[] = [
  { id: "user_1", name: "田中 管理者", email: "admin@example.com", role: "admin", active: true },
  { id: "user_2", name: "佐藤 スタッフ", email: "staff@example.com", role: "staff", active: true },
];

let restaurantSettings: RestaurantSettings = {
  name: "omabo",
  address: "東京都渋谷区1-2-3",
  phone: "+81 3-1234-5678",
  email: "hello@omabo-trattoria.example",
  timezone: "Asia/Tokyo",
  acceptingReservations: true,
  businessHours: [
    { day: "mon", open: "11:30", close: "22:00", closed: false },
    { day: "tue", open: "11:30", close: "22:00", closed: false },
    { day: "wed", open: "11:30", close: "22:00", closed: false },
    { day: "thu", open: "11:30", close: "22:00", closed: false },
    { day: "fri", open: "11:30", close: "23:00", closed: false },
    { day: "sat", open: "11:30", close: "23:00", closed: false },
    { day: "sun", open: "11:30", close: "22:00", closed: true },
  ],
};

let lpCustomization: LpCustomization = {
  displayName: "omabo",
  welcomeMessage: "Book your table online in a couple of minutes.",
  accentColorHex: "#a34a1f",
};

let notificationSettings: NotificationSettings = {
  newReservation: true,
  cancellation: true,
  needsReview: true,
  dailySummary: false,
};

let auditLog: AuditLogEntry[] = [];

// Fixed-group inventory rows (group_default, group_omakase).
let inventorySlots: InventorySlot[] = (() => {
  const slots: InventorySlot[] = [];
  const fixedGroups = capacityGroups.filter(
    (g): g is CapacityGroup & { timeModel: { type: "fixed"; times: string[] } } => g.timeModel.type === "fixed"
  );
  for (let dayOffset = 0; dayOffset < TOTAL_DAYS; dayOffset++) {
    const businessDate = addDays(dayOffset);
    const generated = dayOffset < GENERATED_DAYS;
    for (const group of fixedGroups) {
      for (const time of group.timeModel.times) {
        const hash = hashString(`${group.id}-${businessDate}-${time}`);
        slots.push({
          groupId: group.id,
          businessDate,
          startTimeLabel: time,
          bookedCount: generated ? hash % Math.max(1, group.totalCapacity - 4) : 0,
          heldCount: generated && hash % 5 === 0 ? 1 : 0,
          stopSell: false,
          generated,
        });
      }
    }
  }
  return slots;
})();

// Flexible-group (group_dinner_flex) day activation/stop-sell — there's no
// per-time row to generate, just a per-(group,date) "is this day live" flag.
const flexibleDayActivation = new Map<string, boolean>();
const flexibleDayStopSell = new Map<string, boolean>();
function flexKey(groupId: string, businessDate: string): string {
  return `${groupId}:${businessDate}`;
}
for (let dayOffset = 0; dayOffset < TOTAL_DAYS; dayOffset++) {
  flexibleDayActivation.set(flexKey("group_dinner_flex", addDays(dayOffset)), dayOffset < GENERATED_DAYS);
}

function timeForPlanSeed(plan: SeatingPlan, i: number): string {
  const group = capacityGroups.find((g) => g.id === plan.groupId);
  if (!group) return "18:00";
  if (group.timeModel.type === "fixed") {
    return group.timeModel.times[i % group.timeModel.times.length];
  }
  const { startTime, endTime, intervalMinutes } = group.timeModel;
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  const steps = Math.max(1, Math.floor((end - start) / intervalMinutes));
  return minutesToTime(start + (i % steps) * intervalMinutes);
}

const CHANNELS: SourceChannel[] = ["web", "web", "web", "phone", "ota"];
const GUEST_NAMES = ["田中太郎", "佐藤花子", "鈴木一郎", "高橋美咲", "伊藤健太", "渡辺さくら"];

let reservations: Reservation[] = (() => {
  const list: Reservation[] = [];
  let seq = 1;
  const nextId = () => `res_${seq++}`;
  const makeCode = (id: string) => `OMB-${hashString(id).toString(36).toUpperCase().slice(0, 6)}`;

  for (let dayOffset = 0; dayOffset < GENERATED_DAYS; dayOffset++) {
    const businessDate = addDays(dayOffset);
    for (let i = 0; i < 3; i++) {
      const plan = seatingPlans[(dayOffset + i) % seatingPlans.length];
      const time = timeForPlanSeed(plan, dayOffset + i);
      const id = nextId();
      list.push({
        id,
        code: makeCode(id),
        guestName: GUEST_NAMES[(dayOffset + i) % GUEST_NAMES.length],
        guestEmail: `guest${dayOffset}${i}@example.com`,
        guestPhone: "+81 90-1234-5678",
        partySize: Math.min(plan.maxPartySize, 2 + ((dayOffset + i) % 3)),
        planId: plan.id,
        planName: plan.name,
        groupId: plan.groupId,
        businessDate,
        startTimeLabel: time,
        isoStartsAt: `${businessDate}T${time}:00+09:00`,
        sourceChannel: CHANNELS[(dayOffset + i) % CHANNELS.length],
        status: "confirmed",
        createdVia: "lp",
        // Demo data: pre-assign today's reservations to tables so the
        // day-view timeline has something to show without extra clicks.
        tableId: dayOffset === 0 ? restaurantTables[i % restaurantTables.length].id : undefined,
      });
    }
  }

  // needs_review: one of each reason, seeded on the first generated day so
  // they're easy to find while reviewing.
  const reviewDate = addDays(1);
  const conflictId = nextId();
  list.push({
    id: conflictId,
    code: makeCode(conflictId),
    guestName: "山本次郎",
    guestEmail: "jiro@example.com",
    guestPhone: "+81 90-2222-3333",
    partySize: 6,
    planId: "dinner-course",
    planName: "ディナーコース",
    groupId: "group_dinner_flex",
    businessDate: reviewDate,
    startTimeLabel: "19:00",
    isoStartsAt: `${reviewDate}T19:00:00+09:00`,
    sourceChannel: "web",
    status: "needs_review",
    needsReviewReason: "inventory_conflict",
    createdVia: "lp",
  });

  const lowConfId = nextId();
  list.push({
    id: lowConfId,
    code: makeCode(lowConfId),
    guestName: "(メール解析: 未確定)",
    guestEmail: "reservations-inbox@example.com",
    guestPhone: "",
    partySize: 4,
    planId: "dinner-course",
    planName: "ディナーコース",
    groupId: "group_dinner_flex",
    businessDate: reviewDate,
    startTimeLabel: "18:30",
    isoStartsAt: `${reviewDate}T18:30:00+09:00`,
    sourceChannel: "ota",
    status: "needs_review",
    needsReviewReason: "low_confidence",
    needsReviewDetail: {
      rawEmail:
        "件名: ご予約について\n\n来週土曜19時ごろ、4名でお願いしたいのですが空いていますか。\n山田",
    },
    createdVia: "lp",
  });

  const planUnresolvedId = nextId();
  list.push({
    id: planUnresolvedId,
    code: makeCode(planUnresolvedId),
    guestName: "中村あゆみ",
    guestEmail: "ayumi@example.com",
    guestPhone: "+81 90-4444-5555",
    partySize: 3,
    planId: "",
    planName: "(未確定)",
    businessDate: reviewDate,
    startTimeLabel: "12:30",
    isoStartsAt: `${reviewDate}T12:30:00+09:00`,
    sourceChannel: "ota",
    status: "needs_review",
    needsReviewReason: "plan_unresolved",
    needsReviewDetail: { candidatePlanNames: ["ランチセット", "ディナーコース"] },
    createdVia: "lp",
  });

  // superseded chain, for ADM-04's "previous/新予約" links.
  const originalId = nextId();
  const replacementId = nextId();
  const chainDate = addDays(2);
  list.push({
    id: originalId,
    code: makeCode(originalId),
    guestName: "小林大輔",
    guestEmail: "daisuke@example.com",
    guestPhone: "+81 90-6666-7777",
    partySize: 2,
    planId: "lunch-set",
    planName: "ランチセット",
    groupId: "group_default",
    businessDate: chainDate,
    startTimeLabel: "12:00",
    isoStartsAt: `${chainDate}T12:00:00+09:00`,
    sourceChannel: "web",
    status: "superseded",
    supersededByReservationId: replacementId,
    createdVia: "lp",
  });
  list.push({
    id: replacementId,
    code: makeCode(replacementId),
    guestName: "小林大輔",
    guestEmail: "daisuke@example.com",
    guestPhone: "+81 90-6666-7777",
    partySize: 4,
    planId: "lunch-set",
    planName: "ランチセット",
    groupId: "group_default",
    businessDate: chainDate,
    startTimeLabel: "12:30",
    isoStartsAt: `${chainDate}T12:30:00+09:00`,
    sourceChannel: "web",
    status: "confirmed",
    previousReservationId: originalId,
    createdVia: "lp",
  });

  return list;
})();

// --- Queries -----------------------------------------------------------
// Range-scoped on purpose (mirrors the eventual real API): the calendar
// should only ever ask for the dates it's currently displaying.

export function listReservations(range: { from: string; to: string }): Reservation[] {
  return reservations
    .filter((r) => r.businessDate >= range.from && r.businessDate <= range.to)
    .sort((a, b) => a.isoStartsAt.localeCompare(b.isoStartsAt));
}

export function listNeedsReview(): Reservation[] {
  return reservations.filter((r) => r.status === "needs_review");
}

export function getReservation(id: string): Reservation | undefined {
  return reservations.find((r) => r.id === id);
}

export function listSeatingPlans(): SeatingPlan[] {
  return seatingPlans;
}

export function getSeatingPlan(id: string): SeatingPlan | undefined {
  return seatingPlans.find((p) => p.id === id);
}

export function countActiveReservationsForPlan(planId: string): number {
  return reservations.filter((r) => r.planId === planId && r.status === "confirmed").length;
}

export function countActiveReservationsForGroup(groupId: string): number {
  return reservations.filter((r) => r.groupId === groupId && r.status === "confirmed").length;
}

/** All bookable business dates, independent of any group (used by date pickers). */
export function listBusinessDates(): string[] {
  return Array.from({ length: TOTAL_DAYS }, (_, i) => addDays(i));
}

export function todaysBusinessDate(): string {
  return addDays(0);
}

// --- Mutations: reservations ---------------------------------------------

export function updateReservationStatus(
  id: string,
  status: ReservationStatus,
  extra?: Partial<Reservation>
): Reservation | undefined {
  const reservation = reservations.find((r) => r.id === id);
  if (!reservation) return undefined;
  Object.assign(reservation, { status, ...extra });
  return reservation;
}

export function removeNeedsReviewFlag(id: string): void {
  const reservation = reservations.find((r) => r.id === id);
  if (!reservation) return;
  delete reservation.needsReviewReason;
  delete reservation.needsReviewDetail;
}

export function addReservation(reservation: Reservation): void {
  reservations.push(reservation);
}

export function nextReservationId(): string {
  return `res_manual_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

export function makeReservationCode(id: string): string {
  return `OMB-${hashString(id).toString(36).toUpperCase().slice(0, 6)}`;
}

export function updateSeatingPlanRecord(id: string, updates: Partial<SeatingPlan>): SeatingPlan | undefined {
  const plan = seatingPlans.find((p) => p.id === id);
  if (!plan) return undefined;
  Object.assign(plan, updates);
  return plan;
}

function nextGroupId(): string {
  return `group_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

export function createCapacityGroup(input: { totalCapacity: number; timeModel: TimeModel }): CapacityGroup {
  const group: CapacityGroup = { id: nextGroupId(), ...input };
  capacityGroups.push(group);
  return group;
}

/**
 * Creates a plan and, in the same step, either points it at an existing
 * capacity group (sharing) or spins up a fresh one just for this plan
 * (dedicated). There is no separate "create a group" flow — a group only
 * ever comes into being as a side effect of creating or un-sharing a plan.
 */
export function createSeatingPlan(input: {
  name: string;
  minPartySize: number;
  maxPartySize: number;
  capacity: { mode: "dedicated"; totalCapacity: number; timeModel: TimeModel } | { mode: "share"; groupId: string };
}): SeatingPlan {
  const groupId =
    input.capacity.mode === "dedicated"
      ? createCapacityGroup({ totalCapacity: input.capacity.totalCapacity, timeModel: input.capacity.timeModel }).id
      : input.capacity.groupId;
  const plan: SeatingPlan = {
    id: `plan_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    name: input.name,
    minPartySize: input.minPartySize,
    maxPartySize: input.maxPartySize,
    active: true,
    groupId,
  };
  seatingPlans.push(plan);
  return plan;
}

export function deleteSeatingPlanRecord(id: string): void {
  seatingPlans = seatingPlans.filter((p) => p.id !== id);
}

/** Moves a plan into an existing group, adopting that group's capacity/time model. */
export function joinCapacityGroup(planId: string, targetGroupId: string): void {
  const plan = seatingPlans.find((p) => p.id === planId);
  if (plan) plan.groupId = targetGroupId;
}

/** Splits a plan out of whatever group it's in, into a brand-new solo group. */
export function leaveCapacityGroup(planId: string, totalCapacity: number, timeModel: TimeModel): void {
  const plan = seatingPlans.find((p) => p.id === planId);
  if (!plan) return;
  plan.groupId = createCapacityGroup({ totalCapacity, timeModel }).id;
}

// --- Capacity groups -------------------------------------------------------

export function listCapacityGroups(): CapacityGroup[] {
  return capacityGroups;
}

export function getCapacityGroup(id: string): CapacityGroup | undefined {
  return capacityGroups.find((g) => g.id === id);
}

export function updateCapacityGroup(id: string, updates: Partial<Omit<CapacityGroup, "id">>): void {
  const group = capacityGroups.find((g) => g.id === id);
  if (group) Object.assign(group, updates);
}

export function listPlansForGroup(groupId: string): SeatingPlan[] {
  return seatingPlans.filter((p) => p.groupId === groupId);
}

/** Human-readable stand-in for a group's non-existent "name" — always
 *  derived from its current member plans. */
export function groupDisplayLabel(groupId: string): string {
  const names = listPlansForGroup(groupId).map((p) => p.name);
  return names.length > 0 ? names.join("・") : "(未使用)";
}

// --- Inventory: fixed groups ------------------------------------------------

export function listInventoryForDate(groupId: string, businessDate: string): InventorySlot[] {
  return inventorySlots.filter((s) => s.groupId === groupId && s.businessDate === businessDate);
}

/** Used by the calendar month view, which doesn't care which group — only
 *  whether *some* inventory exists for the day (vs. nothing configured yet). */
export function isAnyGroupGeneratedForDate(businessDate: string): boolean {
  return capacityGroups.some((group) =>
    group.timeModel.type === "fixed"
      ? isFixedDayGenerated(group.id, businessDate)
      : isFlexibleDayGenerated(group.id, businessDate)
  );
}

export function isFixedDayGenerated(groupId: string, businessDate: string): boolean {
  return inventorySlots.some((s) => s.groupId === groupId && s.businessDate === businessDate && s.generated);
}

export function generateFixedDaySlots(groupId: string, businessDate: string): void {
  const group = capacityGroups.find((g) => g.id === groupId);
  if (!group || group.timeModel.type !== "fixed") return;
  const existing = inventorySlots.some((s) => s.groupId === groupId && s.businessDate === businessDate);
  if (existing) {
    inventorySlots = inventorySlots.map((s) =>
      s.groupId === groupId && s.businessDate === businessDate ? { ...s, generated: true } : s
    );
  } else {
    for (const time of group.timeModel.times) {
      inventorySlots.push({ groupId, businessDate, startTimeLabel: time, bookedCount: 0, heldCount: 0, stopSell: false, generated: true });
    }
  }
}

export function setFixedSlotStopSell(groupId: string, businessDate: string, startTimeLabel: string, stopSell: boolean): void {
  const slot = inventorySlots.find(
    (s) => s.groupId === groupId && s.businessDate === businessDate && s.startTimeLabel === startTimeLabel
  );
  if (slot) slot.stopSell = stopSell;
}

export function remainingFixedCapacity(groupId: string, businessDate: string, startTimeLabel: string): number {
  const group = capacityGroups.find((g) => g.id === groupId);
  if (!group) return 0;
  const slot = inventorySlots.find(
    (s) => s.groupId === groupId && s.businessDate === businessDate && s.startTimeLabel === startTimeLabel
  );
  const used = (slot?.bookedCount ?? 0) + (slot?.heldCount ?? 0);
  return group.totalCapacity - used;
}

export function incrementFixedSlotBooking(groupId: string, businessDate: string, startTimeLabel: string): void {
  const slot = inventorySlots.find(
    (s) => s.groupId === groupId && s.businessDate === businessDate && s.startTimeLabel === startTimeLabel
  );
  if (slot) slot.bookedCount += 1;
}

export function findOpenFixedSlotsNear(groupId: string, businessDate: string, partySize: number): InventorySlot[] {
  return inventorySlots.filter(
    (s) =>
      s.groupId === groupId &&
      s.businessDate === businessDate &&
      s.generated &&
      !s.stopSell &&
      remainingFixedCapacity(groupId, s.businessDate, s.startTimeLabel) >= partySize
  );
}

// --- Inventory: flexible groups ----------------------------------------------

export function isFlexibleDayGenerated(groupId: string, businessDate: string): boolean {
  return flexibleDayActivation.get(flexKey(groupId, businessDate)) ?? false;
}

export function generateFlexibleDay(groupId: string, businessDate: string): void {
  flexibleDayActivation.set(flexKey(groupId, businessDate), true);
}

export function isFlexibleDayStopSell(groupId: string, businessDate: string): boolean {
  return flexibleDayStopSell.get(flexKey(groupId, businessDate)) ?? false;
}

export function setFlexibleDayStopSell(groupId: string, businessDate: string, stopSell: boolean): void {
  flexibleDayStopSell.set(flexKey(groupId, businessDate), stopSell);
}

/** Reservations on this date/group whose [start, start+turnTime) overlaps candidateTime's own window. */
function overlappingFlexibleReservations(groupId: string, businessDate: string, candidateTime: string, turnTimeMinutes: number): Reservation[] {
  const candidateStart = timeToMinutes(candidateTime);
  const candidateEnd = candidateStart + turnTimeMinutes;
  return reservations.filter((r) => {
    if (r.groupId !== groupId || r.businessDate !== businessDate || r.status === "cancelled") return false;
    const start = timeToMinutes(r.startTimeLabel);
    return intervalsOverlap(start, start + turnTimeMinutes, candidateStart, candidateEnd);
  });
}

export function remainingFlexibleCapacity(groupId: string, businessDate: string, candidateTime: string): number {
  const group = capacityGroups.find((g) => g.id === groupId);
  if (!group || group.timeModel.type !== "flexible") return 0;
  const overlapping = overlappingFlexibleReservations(groupId, businessDate, candidateTime, group.timeModel.turnTimeMinutes);
  const used = overlapping.reduce((sum, r) => sum + r.partySize, 0);
  return group.totalCapacity - used;
}

export function findOpenFlexibleTimesNear(groupId: string, businessDate: string, partySize: number): string[] {
  const group = capacityGroups.find((g) => g.id === groupId);
  if (!group || group.timeModel.type !== "flexible") return [];
  const { startTime, endTime, intervalMinutes } = group.timeModel;
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  const times: string[] = [];
  for (let t = start; t < end; t += intervalMinutes) {
    const candidate = minutesToTime(t);
    if (remainingFlexibleCapacity(groupId, businessDate, candidate) >= partySize) {
      times.push(candidate);
    }
  }
  return times;
}

export function listFlexibleReservationsForDate(groupId: string, businessDate: string): Reservation[] {
  return reservations
    .filter((r) => r.groupId === groupId && r.businessDate === businessDate && r.status !== "cancelled")
    .sort((a, b) => a.startTimeLabel.localeCompare(b.startTimeLabel));
}

// --- Restaurant tables (floor assignment; separate from capacity/availability) --

export function listTables(): RestaurantTable[] {
  return restaurantTables;
}

export function getTable(id: string): RestaurantTable | undefined {
  return restaurantTables.find((t) => t.id === id);
}

export function createTable(input: { name: string; seatCount: number }): RestaurantTable {
  const table: RestaurantTable = { id: `table_${Date.now()}_${Math.floor(Math.random() * 1000)}`, active: true, ...input };
  restaurantTables.push(table);
  return table;
}

export function updateTableRecord(id: string, updates: Partial<Omit<RestaurantTable, "id">>): void {
  const table = restaurantTables.find((t) => t.id === id);
  if (table) Object.assign(table, updates);
}

export function deleteTableRecord(id: string): void {
  restaurantTables = restaurantTables.filter((t) => t.id !== id);
}

export function countReservationsForTable(tableId: string): number {
  return reservations.filter((r) => r.tableId === tableId && r.status === "confirmed").length;
}

export function assignReservationTable(reservationId: string, tableId: string | null): void {
  const reservation = reservations.find((r) => r.id === reservationId);
  if (!reservation) return;
  if (tableId) {
    reservation.tableId = tableId;
  } else {
    delete reservation.tableId;
  }
}

// --- Admin users (ADM-12 staff directory; unrelated to login role-guessing) --

export function listAdminUsers(): AdminUser[] {
  return adminUsers;
}

export function inviteAdminUser(input: { name: string; email: string; role: AdminUserRole }): void {
  adminUsers.push({ id: `user_${Date.now()}`, active: true, ...input });
}

export function setAdminUserActive(id: string, active: boolean): void {
  const user = adminUsers.find((u) => u.id === id);
  if (user) user.active = active;
}

export function setAdminUserRole(id: string, role: AdminUserRole): void {
  const user = adminUsers.find((u) => u.id === id);
  if (user) user.role = role;
}

// --- Restaurant / LP / notification settings ------------------------------

export function getRestaurantSettings(): RestaurantSettings {
  return restaurantSettings;
}

export function updateRestaurantSettings(updates: Partial<RestaurantSettings>): void {
  restaurantSettings = { ...restaurantSettings, ...updates };
}

export function getLpCustomization(): LpCustomization {
  return lpCustomization;
}

export function updateLpCustomization(updates: Partial<LpCustomization>): void {
  lpCustomization = { ...lpCustomization, ...updates };
}

export function getNotificationSettings(): NotificationSettings {
  return notificationSettings;
}

export function updateNotificationSettings(updates: Partial<NotificationSettings>): void {
  notificationSettings = { ...notificationSettings, ...updates };
}

// --- Audit log -------------------------------------------------------------

export function logAudit(actorEmail: string, action: string, detail?: string): void {
  auditLog.unshift({
    id: `audit_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    at: new Date().toISOString(),
    actorEmail,
    action,
    detail,
  });
}

export function listAuditLog(): AuditLogEntry[] {
  return auditLog;
}
