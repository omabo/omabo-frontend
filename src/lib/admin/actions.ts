"use server";

import { revalidatePath } from "next/cache";

import {
  addReservation,
  assignReservationTable,
  countActiveReservationsForGroup,
  countActiveReservationsForPlan,
  countReservationsForTable,
  createSeatingPlan,
  createTable,
  deleteSeatingPlanRecord,
  deleteTableRecord,
  findOpenFixedSlotsNear,
  findOpenFlexibleTimesNear,
  generateFixedDaySlots,
  generateFlexibleDay,
  getCapacityGroup,
  getReservation,
  getSeatingPlan,
  getTable,
  incrementFixedSlotBooking,
  inviteAdminUser,
  joinCapacityGroup,
  leaveCapacityGroup,
  listPlansForGroup,
  logAudit,
  makeReservationCode,
  nextReservationId,
  remainingFixedCapacity,
  remainingFlexibleCapacity,
  removeNeedsReviewFlag,
  setAdminUserActive,
  setAdminUserRole,
  setFixedSlotStopSell,
  setFlexibleDayStopSell,
  updateCapacityGroup,
  updateLpCustomization,
  updateNotificationSettings,
  updateReservationStatus,
  updateRestaurantSettings,
  updateSeatingPlanRecord,
  updateTableRecord,
  type AdminUserRole,
  type LpCustomization,
  type NotificationSettings,
  type Reservation,
  type RestaurantSettings,
  type SourceChannel,
  type TimeModel,
} from "@/lib/admin/mock-store";
import { getSession } from "@/lib/admin/session";

function revalidateReservationPaths(id?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/reservations");
  revalidatePath("/admin/reservations/needs-review");
  revalidatePath("/admin/inventory");
  if (id) revalidatePath(`/admin/reservations/${id}`);
}

async function actorEmail(): Promise<string> {
  const session = await getSession();
  return session?.email ?? "unknown";
}

export async function resolveNeedsReview(id: string, decision: "confirm" | "reject") {
  const reservation = getReservation(id);
  if (!reservation) return { ok: false as const, message: "予約が見つかりません。" };

  if (decision === "confirm") {
    updateReservationStatus(id, "confirmed");
  } else {
    updateReservationStatus(id, "cancelled");
  }
  removeNeedsReviewFlag(id);
  logAudit(await actorEmail(), decision === "confirm" ? "要確認予約を確定" : "要確認予約を却下", `${reservation.code}`);
  revalidateReservationPaths(id);
  revalidatePath("/admin/audit-log");
  return { ok: true as const };
}

export async function cancelReservation(id: string) {
  const session = await getSession();
  const reservation = getReservation(id);
  if (!reservation) return { ok: false as const, message: "予約が見つかりません。" };

  const refundPending = session?.role === "staff" && reservation.status === "confirmed";
  updateReservationStatus(id, "cancelled", refundPending ? { refundPending: true } : undefined);
  logAudit(session?.email ?? "unknown", "予約をキャンセル", `${reservation.code}${refundPending ? "(返金承認待ち)" : ""}`);
  revalidateReservationPaths(id);
  revalidatePath("/admin/audit-log");
  return { ok: true as const, refundPending };
}

export interface ManualReservationInput {
  businessDate: string;
  startTimeLabel: string;
  planId: string;
  partySize: number;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  notes: string;
  sourceChannel: Exclude<SourceChannel, "web">;
  forceOverride: boolean;
}

export type ManualReservationResult =
  | { ok: true; reservationId: string }
  | { ok: false; reason: "over-capacity"; suggestions: string[] }
  | { ok: false; reason: "no-permission"; suggestions: string[] }
  | { ok: false; reason: "validation"; message: string };

export async function createManualReservation(input: ManualReservationInput): Promise<ManualReservationResult> {
  const session = await getSession();
  const plan = getSeatingPlan(input.planId);
  const group = plan ? getCapacityGroup(plan.groupId) : undefined;
  if (!plan || !group || !input.guestName || !input.businessDate || !input.startTimeLabel) {
    return { ok: false, reason: "validation", message: "必須項目を入力してください。" };
  }

  const remaining =
    group.timeModel.type === "fixed"
      ? remainingFixedCapacity(group.id, input.businessDate, input.startTimeLabel)
      : remainingFlexibleCapacity(group.id, input.businessDate, input.startTimeLabel);
  const overCapacity = input.partySize > remaining;

  if (overCapacity && !input.forceOverride) {
    const canOverride = session?.role === "admin" || session?.role === "super_admin";
    const suggestions =
      group.timeModel.type === "fixed"
        ? findOpenFixedSlotsNear(group.id, input.businessDate, input.partySize).map((s) => s.startTimeLabel)
        : findOpenFlexibleTimesNear(group.id, input.businessDate, input.partySize);
    return {
      ok: false,
      reason: canOverride ? "over-capacity" : "no-permission",
      suggestions,
    };
  }

  // max_party_size 超過は権限に関わらず常に強制登録可(電話予約を断れないため)。
  const id = nextReservationId();
  const reservation: Reservation = {
    id,
    code: makeReservationCode(id),
    guestName: input.guestName,
    guestEmail: input.guestEmail,
    guestPhone: input.guestPhone,
    partySize: input.partySize,
    planId: plan.id,
    planName: plan.name,
    groupId: plan.groupId,
    businessDate: input.businessDate,
    startTimeLabel: input.startTimeLabel,
    isoStartsAt: `${input.businessDate}T${input.startTimeLabel}:00+09:00`,
    sourceChannel: input.sourceChannel,
    status: "confirmed",
    createdVia: "manual",
    notes: input.notes || undefined,
  };
  addReservation(reservation);
  if (group.timeModel.type === "fixed") {
    incrementFixedSlotBooking(group.id, input.businessDate, input.startTimeLabel);
  }
  logAudit(await actorEmail(), "手動予約を登録", `${reservation.code} ${input.guestName}`);
  revalidateReservationPaths();
  revalidatePath("/admin/audit-log");
  return { ok: true, reservationId: id };
}

export type PlanActionResult = { ok: true } | { ok: false; message: string };

export interface CreatePlanInput {
  name: string;
  minPartySize: number;
  maxPartySize: number;
  capacity:
    | { mode: "dedicated"; totalCapacity: number; timeModel: TimeModel }
    | { mode: "share"; groupId: string };
}

export async function createSeatingPlanAction(input: CreatePlanInput): Promise<PlanActionResult> {
  if (!input.name.trim()) {
    return { ok: false, message: "プラン名を入力してください。" };
  }
  if (input.minPartySize < 1 || input.maxPartySize < input.minPartySize) {
    return { ok: false, message: "対応人数を確認してください。" };
  }
  if (input.capacity.mode === "dedicated" && input.capacity.totalCapacity < 1) {
    return { ok: false, message: "定員は1以上で入力してください。" };
  }
  const plan = createSeatingPlan(input);
  logAudit(await actorEmail(), "予約プランを作成", plan.name);
  revalidatePath("/admin/settings/seating-plans");
  revalidatePath("/admin/reservations/new");
  revalidatePath("/admin/inventory");
  revalidatePath("/admin/audit-log");
  return { ok: true };
}

export async function updatePlanInfoAction(
  id: string,
  updates: { name?: string; minPartySize?: number; maxPartySize?: number }
): Promise<PlanActionResult> {
  const plan = getSeatingPlan(id);
  if (!plan) return { ok: false, message: "プランが見つかりません。" };
  updateSeatingPlanRecord(id, updates);
  logAudit(await actorEmail(), "予約プランを更新", updates.name ?? plan.name);
  revalidatePath("/admin/settings/seating-plans");
  revalidatePath("/admin/audit-log");
  return { ok: true };
}

export async function setPlanActiveAction(id: string, active: boolean): Promise<PlanActionResult> {
  const plan = getSeatingPlan(id);
  if (!plan) return { ok: false, message: "プランが見つかりません。" };
  updateSeatingPlanRecord(id, { active });
  logAudit(await actorEmail(), active ? "予約プランを有効化" : "予約プランを無効化", plan.name);
  revalidatePath("/admin/settings/seating-plans");
  revalidatePath("/admin/reservations/new");
  revalidatePath("/admin/audit-log");
  return { ok: true };
}

export async function deleteSeatingPlanAction(id: string): Promise<PlanActionResult> {
  const plan = getSeatingPlan(id);
  if (!plan) return { ok: false, message: "プランが見つかりません。" };
  if (countActiveReservationsForPlan(id) > 0) {
    return { ok: false, message: "既存の予約があるため削除できません。無効化をご利用ください。" };
  }
  deleteSeatingPlanRecord(id);
  logAudit(await actorEmail(), "予約プランを削除", plan.name);
  revalidatePath("/admin/settings/seating-plans");
  revalidatePath("/admin/reservations/new");
  revalidatePath("/admin/audit-log");
  return { ok: true };
}

export async function getGroupSiblingNames(groupId: string, excludePlanId?: string): Promise<string[]> {
  return listPlansForGroup(groupId)
    .filter((p) => p.id !== excludePlanId)
    .map((p) => p.name);
}

export async function updatePlanCapacityAction(
  planId: string,
  updates: { totalCapacity?: number; timeModel?: TimeModel }
): Promise<PlanActionResult> {
  const plan = getSeatingPlan(planId);
  if (!plan) return { ok: false, message: "プランが見つかりません。" };
  const group = getCapacityGroup(plan.groupId);
  if (!group) return { ok: false, message: "座席枠が見つかりません。" };
  const activeReservations = countActiveReservationsForGroup(plan.groupId);
  if (updates.timeModel && updates.timeModel.type !== group.timeModel.type && activeReservations > 0) {
    return { ok: false, message: "既存の予約があるため時間の扱い方(固定枠/自由入力)は変更できません。" };
  }
  updateCapacityGroup(plan.groupId, updates);
  logAudit(await actorEmail(), "定員・時間設定を更新", plan.name);
  revalidatePath("/admin/settings/seating-plans");
  revalidatePath("/admin/inventory");
  revalidatePath("/admin/audit-log");
  return { ok: true };
}

export async function joinGroupAction(planId: string, targetGroupId: string): Promise<PlanActionResult> {
  const plan = getSeatingPlan(planId);
  if (!plan) return { ok: false, message: "プランが見つかりません。" };
  if (countActiveReservationsForPlan(planId) > 0) {
    return { ok: false, message: "既存の予約があるため共有設定は変更できません。" };
  }
  joinCapacityGroup(planId, targetGroupId);
  logAudit(await actorEmail(), "他のプランと定員を共有", plan.name);
  revalidatePath("/admin/settings/seating-plans");
  revalidatePath("/admin/inventory");
  revalidatePath("/admin/audit-log");
  return { ok: true };
}

export async function leaveGroupAction(
  planId: string,
  totalCapacity: number,
  timeModel: TimeModel
): Promise<PlanActionResult> {
  const plan = getSeatingPlan(planId);
  if (!plan) return { ok: false, message: "プランが見つかりません。" };
  if (countActiveReservationsForPlan(planId) > 0) {
    return { ok: false, message: "既存の予約があるため共有設定は変更できません。" };
  }
  leaveCapacityGroup(planId, totalCapacity, timeModel);
  logAudit(await actorEmail(), "共有をやめて専用にする", plan.name);
  revalidatePath("/admin/settings/seating-plans");
  revalidatePath("/admin/inventory");
  revalidatePath("/admin/audit-log");
  return { ok: true };
}

export async function stopSellFixedSlot(groupId: string, businessDate: string, startTimeLabel: string, stopSell: boolean) {
  setFixedSlotStopSell(groupId, businessDate, startTimeLabel, stopSell);
  logAudit(await actorEmail(), stopSell ? "売止に設定" : "売止を解除", `${businessDate} ${startTimeLabel}`);
  revalidatePath("/admin/inventory");
  revalidatePath("/admin/audit-log");
}

export async function stopSellFlexibleDay(groupId: string, businessDate: string, stopSell: boolean) {
  setFlexibleDayStopSell(groupId, businessDate, stopSell);
  logAudit(await actorEmail(), stopSell ? "売止に設定" : "売止を解除", businessDate);
  revalidatePath("/admin/inventory");
  revalidatePath("/admin/audit-log");
}

export async function generateFixedDay(groupId: string, businessDate: string) {
  generateFixedDaySlots(groupId, businessDate);
  logAudit(await actorEmail(), "時間枠を生成", businessDate);
  revalidatePath("/admin/inventory");
  revalidatePath("/admin/reservations/new");
  revalidatePath("/admin/audit-log");
}

export async function generateFlexibleDayAction(groupId: string, businessDate: string) {
  generateFlexibleDay(groupId, businessDate);
  logAudit(await actorEmail(), "時間枠を生成", businessDate);
  revalidatePath("/admin/inventory");
  revalidatePath("/admin/reservations/new");
  revalidatePath("/admin/audit-log");
}

export type SettingsResult = { ok: true } | { ok: false; message: string };

export async function inviteAdminUserAction(input: {
  name: string;
  email: string;
  role: AdminUserRole;
}): Promise<SettingsResult> {
  if (!input.name || !input.email) {
    return { ok: false, message: "氏名とメールアドレスを入力してください。" };
  }
  inviteAdminUser(input);
  logAudit(await actorEmail(), "ユーザーを招待", `${input.email}(${input.role})`);
  revalidatePath("/admin/settings/users");
  revalidatePath("/admin/audit-log");
  return { ok: true };
}

export async function setAdminUserActiveAction(id: string, active: boolean, label: string): Promise<SettingsResult> {
  setAdminUserActive(id, active);
  logAudit(await actorEmail(), active ? "ユーザーを有効化" : "ユーザーを無効化", label);
  revalidatePath("/admin/settings/users");
  revalidatePath("/admin/audit-log");
  return { ok: true };
}

export async function setAdminUserRoleAction(id: string, role: AdminUserRole, label: string): Promise<SettingsResult> {
  setAdminUserRole(id, role);
  logAudit(await actorEmail(), "ユーザーのロールを変更", `${label} -> ${role}`);
  revalidatePath("/admin/settings/users");
  revalidatePath("/admin/audit-log");
  return { ok: true };
}

export async function updateRestaurantSettingsAction(updates: Partial<RestaurantSettings>): Promise<SettingsResult> {
  updateRestaurantSettings(updates);
  logAudit(await actorEmail(), "店舗基本設定を更新");
  revalidatePath("/admin/settings/restaurant");
  revalidatePath("/admin/audit-log");
  return { ok: true };
}

export async function updateLpCustomizationAction(updates: Partial<LpCustomization>): Promise<SettingsResult> {
  updateLpCustomization(updates);
  logAudit(await actorEmail(), "LPカスタマイズを更新");
  revalidatePath("/admin/settings/lp-customization");
  revalidatePath("/admin/audit-log");
  return { ok: true };
}

export async function updateNotificationSettingsAction(
  updates: Partial<NotificationSettings>
): Promise<SettingsResult> {
  updateNotificationSettings(updates);
  logAudit(await actorEmail(), "通知設定を更新");
  revalidatePath("/admin/settings/notifications");
  revalidatePath("/admin/audit-log");
  return { ok: true };
}

export async function createTableAction(input: { name: string; seatCount: number }): Promise<SettingsResult> {
  const table = createTable(input);
  logAudit(await actorEmail(), "テーブルを登録", table.name);
  revalidatePath("/admin/settings/tables");
  revalidatePath("/admin/audit-log");
  return { ok: true };
}

export async function updateTableAction(
  id: string,
  updates: Partial<{ name: string; seatCount: number; active: boolean }>
): Promise<SettingsResult> {
  const table = getTable(id);
  if (!table) return { ok: false, message: "テーブルが見つかりません。" };
  updateTableRecord(id, updates);
  logAudit(await actorEmail(), "テーブル情報を更新", table.name);
  revalidatePath("/admin/settings/tables");
  revalidatePath("/admin/reservations");
  revalidatePath("/admin/audit-log");
  return { ok: true };
}

export async function deleteTableAction(id: string): Promise<SettingsResult> {
  const table = getTable(id);
  if (!table) return { ok: false, message: "テーブルが見つかりません。" };
  if (countReservationsForTable(id) > 0) {
    return { ok: false, message: "既存の予約が割り当てられているため削除できません。" };
  }
  deleteTableRecord(id);
  logAudit(await actorEmail(), "テーブルを削除", table.name);
  revalidatePath("/admin/settings/tables");
  revalidatePath("/admin/reservations");
  revalidatePath("/admin/audit-log");
  return { ok: true };
}

export async function assignTableAction(reservationId: string, tableId: string | null): Promise<SettingsResult> {
  const reservation = getReservation(reservationId);
  if (!reservation) return { ok: false, message: "予約が見つかりません。" };
  const table = tableId ? getTable(tableId) : undefined;
  assignReservationTable(reservationId, tableId);
  logAudit(await actorEmail(), "卓を割り当て", `${reservation.code} -> ${table?.name ?? "未割り当て"}`);
  revalidateReservationPaths(reservationId);
  revalidatePath("/admin/audit-log");
  return { ok: true };
}
