"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { copy } from "@/lib/admin/copy";
import {
  deleteSeatingPlanAction,
  joinGroupAction,
  leaveGroupAction,
  setPlanActiveAction,
  updatePlanCapacityAction,
  updatePlanInfoAction,
} from "@/lib/admin/actions";
import type { CapacityGroup, SeatingPlan, TimeModel } from "@/lib/admin/mock-store";

interface OtherPlan {
  id: string;
  name: string;
  groupId: string;
  totalCapacity: number;
}

function timeModelSummary(tm: TimeModel): string {
  if (tm.type === "fixed") {
    return tm.times.length > 0 ? tm.times.join(" / ") : "(時刻未設定)";
  }
  return `${tm.startTime}〜${tm.endTime}・${tm.intervalMinutes}分刻み・回転${tm.turnTimeMinutes}分`;
}

export function SeatingPlanEditor({
  plan,
  group,
  siblingNames,
  otherPlans,
  activeReservationCount,
}: {
  plan: SeatingPlan;
  group: CapacityGroup;
  siblingNames: string[];
  otherPlans: OtherPlan[];
  activeReservationCount: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(plan.name);
  const [minPartySize, setMinPartySize] = useState(plan.minPartySize);
  const [maxPartySize, setMaxPartySize] = useState(plan.maxPartySize);
  const [totalCapacity, setTotalCapacity] = useState(group.totalCapacity);
  const [timeModel, setTimeModel] = useState<TimeModel>(group.timeModel);
  const [newTime, setNewTime] = useState("");
  const [timeModelExpanded, setTimeModelExpanded] = useState(false);

  const [shareMode, setShareMode] = useState<"view" | "choose-partner" | "leave">("view");
  const [sharePartnerId, setSharePartnerId] = useState(otherPlans[0]?.id ?? "");
  const [leaveCapacity, setLeaveCapacity] = useState(group.totalCapacity);

  const isShared = siblingNames.length > 0;
  const sharePartner = otherPlans.find((p) => p.id === sharePartnerId);

  const saveAll = () => {
    startTransition(async () => {
      const [infoResult, capacityResult] = await Promise.all([
        updatePlanInfoAction(plan.id, { name, minPartySize, maxPartySize }),
        updatePlanCapacityAction(plan.id, { totalCapacity, timeModel }),
      ]);
      const failed = !infoResult.ok ? infoResult : !capacityResult.ok ? capacityResult : null;
      if (failed) {
        setError(failed.message);
        return;
      }
      setError(null);
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Card>
        <CardContent className="space-y-4 text-sm">
          {/* 基本情報 */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-3 space-y-1.5 sm:col-span-1">
              <Label>プラン名</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>最小人数</Label>
              <Input type="number" min={1} value={minPartySize} onChange={(e) => setMinPartySize(Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label>最大人数</Label>
              <Input type="number" min={1} value={maxPartySize} onChange={(e) => setMaxPartySize(Number(e.target.value))} />
            </div>
          </div>

          {/* 定員(専用/共有の一体表示) */}
          <div className="space-y-2 border-t border-border pt-4">
            <p className="font-medium">{copy.seatingPlans.capacityHeading}</p>
            <div className="space-y-1.5">
              <Label>{copy.seatingPlans.totalCapacity}</Label>
              <Input type="number" min={1} value={totalCapacity} onChange={(e) => setTotalCapacity(Number(e.target.value))} />
            </div>
            <p className="text-muted-foreground">
              {isShared ? copy.seatingPlans.sharedLabel(siblingNames.join("・")) : copy.seatingPlans.dedicatedLabel(totalCapacity)}
            </p>
            {isShared ? (
              <p className="rounded-md border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                {copy.seatingPlans.impactWarning(siblingNames.join("・"))}
              </p>
            ) : null}
          </div>

          {/* 時間設定(折りたたみ) */}
          <div className="space-y-2 border-t border-border pt-4">
            <p className="font-medium">{copy.seatingPlans.timeHeading}</p>
            <p className="text-muted-foreground">
              {timeModel.type === "fixed" ? copy.seatingPlans.fixed : copy.seatingPlans.flexible} ・ {timeModelSummary(timeModel)}
            </p>
            <Button type="button" variant="outline" size="sm" onClick={() => setTimeModelExpanded((v) => !v)}>
              {timeModelExpanded ? copy.seatingPlans.hideTimeModel : copy.seatingPlans.editTimeModel}
            </Button>

            {timeModelExpanded ? (
              <div className="space-y-3 pt-2">
                <div className="space-y-1.5">
                  <Label>{copy.seatingPlans.timeModelType}</Label>
                  <Select
                    value={timeModel.type}
                    onValueChange={(v) => {
                      const type = (v ?? "fixed") as TimeModel["type"];
                      setTimeModel(
                        type === "fixed"
                          ? { type: "fixed", times: timeModel.type === "fixed" ? timeModel.times : [] }
                          : { type: "flexible", startTime: "17:00", endTime: "21:00", intervalMinutes: 15, turnTimeMinutes: 90 }
                      );
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue>{(v: TimeModel["type"]) => (v === "fixed" ? copy.seatingPlans.fixed : copy.seatingPlans.flexible)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">{copy.seatingPlans.fixed}</SelectItem>
                      <SelectItem value="flexible">{copy.seatingPlans.flexible}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {timeModel.type === "fixed" ? (
                  <div className="space-y-1.5">
                    <Label>{copy.seatingPlans.fixedTimes}</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {timeModel.times.map((time) => (
                        <span key={time} className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs">
                          {time}
                          <button
                            type="button"
                            aria-label={`${time}を削除`}
                            onClick={() => setTimeModel({ type: "fixed", times: timeModel.times.filter((t) => t !== time) })}
                          >
                            <X className="size-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input type="time" className="w-32" value={newTime} onChange={(e) => setNewTime(e.target.value)} />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (!newTime || timeModel.type !== "fixed" || timeModel.times.includes(newTime)) return;
                          setTimeModel({ type: "fixed", times: [...timeModel.times, newTime].sort() });
                          setNewTime("");
                        }}
                      >
                        {copy.seatingPlans.addTime}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>{copy.seatingPlans.startTime}</Label>
                      <Input type="time" value={timeModel.startTime} onChange={(e) => setTimeModel({ ...timeModel, startTime: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>{copy.seatingPlans.endTime}</Label>
                      <Input type="time" value={timeModel.endTime} onChange={(e) => setTimeModel({ ...timeModel, endTime: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>{copy.seatingPlans.intervalMinutes}</Label>
                      <Input type="number" min={5} step={5} value={timeModel.intervalMinutes} onChange={(e) => setTimeModel({ ...timeModel, intervalMinutes: Number(e.target.value) })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>{copy.seatingPlans.turnTimeMinutes}</Label>
                      <Input type="number" min={15} step={15} value={timeModel.turnTimeMinutes} onChange={(e) => setTimeModel({ ...timeModel, turnTimeMinutes: Number(e.target.value) })} />
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <Button disabled={pending} onClick={saveAll}>
            {copy.seatingPlans.save}
          </Button>
        </CardContent>
      </Card>

      {/* 共有(専用/共有の切り替えは通常保存とは別の明示操作) */}
      <Card>
        <CardContent className="space-y-2 text-sm">
          {shareMode === "choose-partner" ? (
            <div className="space-y-2">
              <Label>{copy.seatingPlans.chooseSharePartner}</Label>
              <Select value={sharePartnerId} onValueChange={(v) => setSharePartnerId(v ?? "")}>
                <SelectTrigger>
                  <SelectValue>{(v: string) => otherPlans.find((p) => p.id === v)?.name ?? v}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {otherPlans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {sharePartner ? (
                <p className="text-xs text-muted-foreground">{copy.seatingPlans.sharePreview(sharePartner.totalCapacity)}</p>
              ) : null}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={pending || !sharePartner}
                  onClick={() =>
                    startTransition(async () => {
                      if (!sharePartner) return;
                      const result = await joinGroupAction(plan.id, sharePartner.groupId);
                      if (!result.ok) {
                        setError(result.message);
                        return;
                      }
                      setError(null);
                      setShareMode("view");
                      router.refresh();
                    })
                  }
                >
                  参加する
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShareMode("view")}>
                  やめる
                </Button>
              </div>
            </div>
          ) : shareMode === "leave" ? (
            <div className="space-y-2">
              <Label>{copy.seatingPlans.leavePrompt}</Label>
              <Input type="number" min={1} value={leaveCapacity} onChange={(e) => setLeaveCapacity(Number(e.target.value))} />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      const result = await leaveGroupAction(plan.id, leaveCapacity, group.timeModel);
                      if (!result.ok) {
                        setError(result.message);
                        return;
                      }
                      setError(null);
                      setShareMode("view");
                      router.refresh();
                    })
                  }
                >
                  専用にする
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShareMode("view")}>
                  やめる
                </Button>
              </div>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              disabled={otherPlans.length === 0}
              onClick={() => setShareMode(isShared ? "leave" : "choose-partner")}
            >
              {isShared ? copy.seatingPlans.makeDedicated : copy.seatingPlans.shareWith}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* 危険な操作(通常設定と視覚的に分離) */}
      <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
        <p className="text-sm font-medium text-destructive">{copy.seatingPlans.dangerZoneTitle}</p>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await setPlanActiveAction(plan.id, !plan.active);
                router.refresh();
              })
            }
          >
            {plan.active ? copy.seatingPlans.deactivate : copy.seatingPlans.activate}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                if (!window.confirm(copy.seatingPlans.deleteConfirm)) return;
                const result = await deleteSeatingPlanAction(plan.id);
                if (!result.ok) {
                  setError(result.message);
                  return;
                }
                router.push("/settings/seating-plans");
              })
            }
          >
            {copy.seatingPlans.delete}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{copy.seatingPlans.currentUsage(activeReservationCount)}</p>
      </div>
    </div>
  );
}
