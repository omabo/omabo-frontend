"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChannelDot, CHANNEL_LABEL } from "@/components/admin/calendar/channel-dot";
import { assignTableAction } from "@/lib/admin/actions";
import { copy } from "@/lib/admin/copy";
import type { Reservation, RestaurantTable } from "@/lib/admin/mock-store";

const UNASSIGNED = "__unassigned__";

export function DayView({ reservations, tables }: { reservations: Reservation[]; tables: RestaurantTable[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const tableName = (id: string) => tables.find((t) => t.id === id)?.name ?? copy.calendarTable.unassigned;

  if (reservations.length === 0) {
    return <p className="text-sm text-muted-foreground">{copy.calendar.noSlotsGenerated}</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>時間</TableHead>
          <TableHead>お客様</TableHead>
          <TableHead>人数</TableHead>
          <TableHead>プラン</TableHead>
          <TableHead>{copy.common.channel}</TableHead>
          <TableHead>状態</TableHead>
          <TableHead>{copy.calendarTable.columnHeading}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reservations.map((r) => (
          <TableRow key={r.id} className="cursor-pointer" onClick={() => router.push(`/reservations/${r.id}`)}>
            <TableCell className="tabular-nums">{r.startTimeLabel}</TableCell>
            <TableCell>{r.guestName}</TableCell>
            <TableCell>{copy.common.guests(r.partySize)}</TableCell>
            <TableCell>{r.planName}</TableCell>
            <TableCell>
              <span className="flex items-center gap-1.5">
                <ChannelDot channel={r.sourceChannel} />
                {CHANNEL_LABEL[r.sourceChannel]}
              </span>
            </TableCell>
            <TableCell>
              {r.status === "needs_review" ? (
                <Badge variant="destructive">{copy.calendar.needsReviewBadge}</Badge>
              ) : r.status === "cancelled" ? (
                <Badge variant="outline">キャンセル</Badge>
              ) : r.status === "superseded" ? (
                <Badge variant="outline">変更済み</Badge>
              ) : (
                <Badge variant="secondary">確定</Badge>
              )}
            </TableCell>
            <TableCell onClick={(e) => e.stopPropagation()}>
              <Select
                value={r.tableId ?? UNASSIGNED}
                disabled={pending}
                onValueChange={(v) =>
                  startTransition(async () => {
                    await assignTableAction(r.id, v === UNASSIGNED ? null : (v ?? null));
                    router.refresh();
                  })
                }
              >
                <SelectTrigger size="sm">
                  <SelectValue>{(v: string) => (v === UNASSIGNED ? copy.calendarTable.unassigned : tableName(v))}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNASSIGNED}>{copy.calendarTable.unassigned}</SelectItem>
                  {tables.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
