"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { copy } from "@/lib/admin/copy";
import {
  createManualReservation,
  generateFixedDay,
  generateFlexibleDayAction,
  type ManualReservationResult,
} from "@/lib/admin/actions";
import { formatFullDateLabel } from "@/lib/admin/date-utils";
import type { CapacityGroup, SeatingPlan, SourceChannel } from "@/lib/admin/mock-store";

type ManualSourceChannel = Exclude<SourceChannel, "web">;

const CHANNEL_OPTIONS: ManualSourceChannel[] = ["phone", "ota", "walk-in"];
const CHANNEL_OPTION_LABEL: Record<ManualSourceChannel, string> = {
  phone: copy.manualEntry.channelPhone,
  ota: copy.manualEntry.channelOta,
  "walk-in": copy.manualEntry.channelWalkIn,
};

export function ManualEntryForm({
  businessDates,
  plans,
  groups,
  generatedDatesByGroup,
}: {
  businessDates: string[];
  plans: SeatingPlan[];
  groups: CapacityGroup[];
  generatedDatesByGroup: Record<string, string[]>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [generatedByGroup, setGeneratedByGroup] = useState(generatedDatesByGroup);

  const [businessDate, setBusinessDate] = useState(businessDates[0] ?? "");
  const [planId, setPlanId] = useState(plans[0]?.id ?? "");
  const plan = useMemo(() => plans.find((p) => p.id === planId), [plans, planId]);
  const group = useMemo(() => groups.find((g) => g.id === plan?.groupId), [groups, plan]);

  const [startTimeLabel, setStartTimeLabel] = useState(
    group?.timeModel.type === "fixed" ? (group.timeModel.times[0] ?? "") : (group?.timeModel.startTime ?? "")
  );
  const [sourceChannel, setSourceChannel] = useState<ManualSourceChannel>("phone");
  const [partySize, setPartySize] = useState(2);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [notes, setNotes] = useState("");

  const [result, setResult] = useState<ManualReservationResult | null>(null);

  const isGenerated = group ? (generatedByGroup[group.id] ?? []).includes(businessDate) : false;

  const selectPlan = (nextPlanId: string) => {
    setPlanId(nextPlanId);
    const nextPlan = plans.find((p) => p.id === nextPlanId);
    const nextGroup = groups.find((g) => g.id === nextPlan?.groupId);
    setStartTimeLabel(
      nextGroup?.timeModel.type === "fixed" ? (nextGroup.timeModel.times[0] ?? "") : (nextGroup?.timeModel.startTime ?? "")
    );
  };

  // Synchronous guard against double-fired submit events (observed with
  // Base UI's Button type="submit" inside a form) — without this, one click
  // can create the same reservation twice before React re-renders `pending`.
  const submittingRef = useRef(false);

  const submit = (forceOverride: boolean) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    startTransition(async () => {
      const res = await createManualReservation({
        businessDate,
        startTimeLabel,
        planId,
        partySize,
        guestName,
        guestPhone,
        guestEmail,
        notes,
        sourceChannel,
        forceOverride,
      });
      submittingRef.current = false;
      setResult(res);
      if (res.ok) {
        router.push(`/reservations/${res.reservationId}`);
      }
    });
  };

  if (!plan || !group) {
    return <p className="text-sm text-muted-foreground">プランが見つかりません。</p>;
  }

  if (!isGenerated) {
    return (
      <div className="space-y-3 rounded-lg border border-border p-4">
        <Label>{copy.manualEntry.date}</Label>
        <Select value={businessDate} onValueChange={(v) => setBusinessDate(v ?? "")}>
          <SelectTrigger>
            <SelectValue>{(v: string) => (v ? formatFullDateLabel(v) : null)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {businessDates.map((d) => (
              <SelectItem key={d} value={d}>
                {formatFullDateLabel(d)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">{copy.manualEntry.slotNotGenerated}</p>
        <Button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              if (group.timeModel.type === "fixed") {
                await generateFixedDay(group.id, businessDate);
              } else {
                await generateFlexibleDayAction(group.id, businessDate);
              }
              setGeneratedByGroup((prev) => ({
                ...prev,
                [group.id]: [...(prev[group.id] ?? []), businessDate],
              }));
            })
          }
        >
          {copy.manualEntry.generateAndRegister}
        </Button>
      </div>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        submit(false);
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>{copy.manualEntry.date}</Label>
          <Select value={businessDate} onValueChange={(v) => setBusinessDate(v ?? "")}>
            <SelectTrigger>
              <SelectValue>{(v: string) => (v ? formatFullDateLabel(v) : null)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {businessDates.map((d) => (
                <SelectItem key={d} value={d}>
                  {formatFullDateLabel(d)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>{copy.manualEntry.time}</Label>
          {group.timeModel.type === "fixed" ? (
            <Select value={startTimeLabel} onValueChange={(v) => setStartTimeLabel(v ?? "")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {group.timeModel.times.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              type="time"
              min={group.timeModel.startTime}
              max={group.timeModel.endTime}
              step={group.timeModel.intervalMinutes * 60}
              value={startTimeLabel}
              onChange={(e) => setStartTimeLabel(e.target.value)}
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>{copy.manualEntry.plan}</Label>
          <Select value={planId} onValueChange={(v) => selectPlan(v ?? planId)}>
            <SelectTrigger>
              <SelectValue>{(v: string) => plans.find((p) => p.id === v)?.name ?? v}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {plans.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="partySize">{copy.manualEntry.partySize}</Label>
          <Input
            id="partySize"
            type="number"
            min={1}
            value={partySize}
            onChange={(e) => setPartySize(Number(e.target.value))}
          />
          {partySize < plan.minPartySize || partySize > plan.maxPartySize ? (
            <p className="text-xs text-muted-foreground">
              このプランの想定人数は{plan.minPartySize}〜{plan.maxPartySize}名です
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>{copy.common.channel}</Label>
        <Select value={sourceChannel} onValueChange={(v) => setSourceChannel((v ?? "phone") as ManualSourceChannel)}>
          <SelectTrigger>
            <SelectValue>{(v: ManualSourceChannel) => CHANNEL_OPTION_LABEL[v]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {CHANNEL_OPTIONS.map((c) => (
              <SelectItem key={c} value={c}>
                {CHANNEL_OPTION_LABEL[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="guestName">{copy.manualEntry.guestName}</Label>
        <Input id="guestName" required value={guestName} onChange={(e) => setGuestName(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="guestPhone">{copy.manualEntry.guestPhone}</Label>
          <Input id="guestPhone" required value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="guestEmail">{copy.manualEntry.guestEmail}</Label>
          <Input id="guestEmail" type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="notes">{copy.manualEntry.notes}</Label>
        <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      {result && !result.ok && result.reason === "validation" ? (
        <p className="text-sm text-destructive">{result.message}</p>
      ) : null}

      {result && !result.ok && (result.reason === "over-capacity" || result.reason === "no-permission") ? (
        <div className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
          <p>{result.reason === "over-capacity" ? copy.manualEntry.overCapacityWarning : copy.manualEntry.noPermission}</p>
          {result.suggestions.length > 0 ? (
            <div>
              <p className="text-xs font-medium text-muted-foreground">{copy.manualEntry.suggestions}</p>
              <ul className="mt-1 list-inside list-disc text-xs">
                {result.suggestions.map((time) => (
                  <li key={time}>{time}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {result.reason === "over-capacity" ? (
            <Button type="button" variant="destructive" disabled={pending} onClick={() => submit(true)}>
              {copy.manualEntry.forceSubmit}
            </Button>
          ) : null}
        </div>
      ) : null}

      <Button type="submit" disabled={pending}>
        {copy.manualEntry.submit}
      </Button>
    </form>
  );
}
