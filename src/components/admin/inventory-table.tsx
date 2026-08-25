"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { copy } from "@/lib/admin/copy";
import {
  generateFixedDay,
  generateFlexibleDayAction,
  stopSellFixedSlot,
  stopSellFlexibleDay,
} from "@/lib/admin/actions";
import { minutesToTime, timeToMinutes, type CapacityGroup, type InventorySlot, type Reservation } from "@/lib/admin/mock-store";

export function InventoryTable({
  group,
  businessDate,
  generated,
  fixedSlots,
  flexibleReservations,
  flexibleStopSell,
}: {
  group: CapacityGroup;
  businessDate: string;
  generated: boolean;
  fixedSlots: InventorySlot[];
  flexibleReservations: Reservation[];
  flexibleStopSell: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (!generated) {
    return (
      <div className="space-y-3 rounded-lg border border-border p-4">
        <p className="text-sm text-muted-foreground">{copy.inventory.notGenerated}</p>
        <Button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              if (group.timeModel.type === "fixed") {
                await generateFixedDay(group.id, businessDate);
              } else {
                await generateFlexibleDayAction(group.id, businessDate);
              }
              router.refresh();
            })
          }
        >
          {copy.inventory.generate}
        </Button>
      </div>
    );
  }

  if (group.timeModel.type === "fixed") {
    return (
      <div className="space-y-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{copy.inventory.time}</TableHead>
              <TableHead>{copy.inventory.capacity}</TableHead>
              <TableHead>{copy.inventory.booked}</TableHead>
              <TableHead>{copy.inventory.held}</TableHead>
              <TableHead>{copy.inventory.remaining}</TableHead>
              <TableHead>{copy.inventory.stopSell}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fixedSlots.map((slot) => (
              <TableRow key={slot.startTimeLabel}>
                <TableCell className="tabular-nums">{slot.startTimeLabel}</TableCell>
                <TableCell>{group.totalCapacity}</TableCell>
                <TableCell>{slot.bookedCount}</TableCell>
                <TableCell>{slot.heldCount > 0 ? `決済処理中 ${slot.heldCount}件` : "-"}</TableCell>
                <TableCell>{group.totalCapacity - slot.bookedCount - slot.heldCount}</TableCell>
                <TableCell>
                  <Checkbox
                    checked={slot.stopSell}
                    disabled={pending}
                    onCheckedChange={(checked) =>
                      startTransition(async () => {
                        await stopSellFixedSlot(group.id, businessDate, slot.startTimeLabel, checked === true);
                        router.refresh();
                      })
                    }
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className="text-xs text-muted-foreground">{copy.inventory.stopSellNote}</p>
      </div>
    );
  }

  const { turnTimeMinutes } = group.timeModel;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm">
        <Checkbox
          id="flex-stop-sell"
          checked={flexibleStopSell}
          disabled={pending}
          onCheckedChange={(checked) =>
            startTransition(async () => {
              await stopSellFlexibleDay(group.id, businessDate, checked === true);
              router.refresh();
            })
          }
        />
        <label htmlFor="flex-stop-sell">{copy.inventory.stopSell}</label>
      </div>
      <p className="text-xs text-muted-foreground">{copy.inventory.turnTimeNote(turnTimeMinutes)}</p>
      {flexibleReservations.length === 0 ? (
        <p className="text-sm text-muted-foreground">{copy.inventory.flexibleReservationsEmpty}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{copy.inventory.time}</TableHead>
              <TableHead>{copy.inventory.endsAt}</TableHead>
              <TableHead>お客様</TableHead>
              <TableHead>{copy.manualEntry.partySize}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {flexibleReservations.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="tabular-nums">{r.startTimeLabel}</TableCell>
                <TableCell className="tabular-nums text-muted-foreground">
                  {minutesToTime(timeToMinutes(r.startTimeLabel) + turnTimeMinutes)}
                </TableCell>
                <TableCell>{r.guestName}</TableCell>
                <TableCell>{copy.common.guests(r.partySize)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
