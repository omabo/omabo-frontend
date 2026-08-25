"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { createSeatingPlanAction } from "@/lib/admin/actions";
import type { TimeModel } from "@/lib/admin/mock-store";

interface ExistingPlan {
  id: string;
  name: string;
  groupId: string;
  totalCapacity: number;
}

export function CreatePlanForm({ existingPlans }: { existingPlans: ExistingPlan[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [minPartySize, setMinPartySize] = useState(1);
  const [maxPartySize, setMaxPartySize] = useState(4);

  const [capacityMode, setCapacityMode] = useState<"dedicated" | "share">("dedicated");
  const [totalCapacity, setTotalCapacity] = useState(10);
  const [timeModel, setTimeModel] = useState<TimeModel>({ type: "fixed", times: [] });
  const [newTime, setNewTime] = useState("");
  const [sharePartnerId, setSharePartnerId] = useState(existingPlans[0]?.id ?? "");
  const sharePartner = existingPlans.find((p) => p.id === sharePartnerId);
  // Synchronous guard against double-fired submit events (observed with
  // Base UI's Button type="submit" inside a form) — React state alone isn't
  // fast enough to block a second dispatch in the same tick.
  const submittingRef = useRef(false);

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (submittingRef.current) return;
        submittingRef.current = true;
        startTransition(async () => {
          const result = await createSeatingPlanAction({
            name,
            minPartySize,
            maxPartySize,
            capacity:
              capacityMode === "dedicated"
                ? { mode: "dedicated", totalCapacity, timeModel }
                : { mode: "share", groupId: sharePartner?.groupId ?? "" },
          });
          if (!result.ok) {
            submittingRef.current = false;
            setError(result.message);
            return;
          }
          router.push("/settings/seating-plans");
        });
      }}
    >
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="space-y-1.5">
        <Label htmlFor="plan-name">{copy.createPlan.name}</Label>
        <Input id="plan-name" required value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="min-party">{copy.createPlan.minPartySize}</Label>
          <Input id="min-party" type="number" min={1} value={minPartySize} onChange={(e) => setMinPartySize(Number(e.target.value))} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="max-party">{copy.createPlan.maxPartySize}</Label>
          <Input id="max-party" type="number" min={1} value={maxPartySize} onChange={(e) => setMaxPartySize(Number(e.target.value))} />
        </div>
      </div>

      <div className="space-y-2 border-t border-border pt-4">
        <p className="font-medium text-sm">{copy.createPlan.capacityHeading}</p>
        <div className="space-y-2 text-sm">
          <label className="flex items-center gap-2">
            <input type="radio" checked={capacityMode === "dedicated"} onChange={() => setCapacityMode("dedicated")} />
            {copy.createPlan.dedicatedOption}
          </label>
          {existingPlans.length > 0 ? (
            <label className="flex items-center gap-2">
              <input type="radio" checked={capacityMode === "share"} onChange={() => setCapacityMode("share")} />
              {copy.createPlan.shareOption}
            </label>
          ) : null}
        </div>

        {capacityMode === "dedicated" ? (
          <div className="space-y-3 rounded-md border border-border p-3">
            <div className="space-y-1.5">
              <Label>{copy.seatingPlans.totalCapacity}</Label>
              <Input type="number" min={1} value={totalCapacity} onChange={(e) => setTotalCapacity(Number(e.target.value))} />
            </div>
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
                      <button type="button" aria-label={`${time}を削除`} onClick={() => setTimeModel({ type: "fixed", times: timeModel.times.filter((t) => t !== time) })}>
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
        ) : (
          <div className="space-y-2 rounded-md border border-border p-3">
            <Label>{copy.createPlan.sharePartnerLabel}</Label>
            <Select value={sharePartnerId} onValueChange={(v) => setSharePartnerId(v ?? "")}>
              <SelectTrigger>
                <SelectValue>{(v: string) => existingPlans.find((p) => p.id === v)?.name ?? v}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {existingPlans.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {sharePartner ? (
              <p className="text-xs text-muted-foreground">{copy.seatingPlans.sharePreview(sharePartner.totalCapacity)}</p>
            ) : null}
          </div>
        )}
      </div>

      <Button type="submit" disabled={pending}>
        {copy.createPlan.submit}
      </Button>
    </form>
  );
}
