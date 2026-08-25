"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { copy } from "@/lib/admin/copy";
import { createTableAction, deleteTableAction, updateTableAction } from "@/lib/admin/actions";
import type { RestaurantTable } from "@/lib/admin/mock-store";

function EditRow({ table, onCancel }: { table: RestaurantTable; onCancel: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(table.name);
  const [seatCount, setSeatCount] = useState(String(table.seatCount));
  const [error, setError] = useState<string | null>(null);

  return (
    <TableRow>
      <TableCell>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          min={1}
          className="w-20"
          value={seatCount}
          onChange={(e) => setSeatCount(e.target.value)}
        />
      </TableCell>
      <TableCell>
        <Badge variant={table.active ? "secondary" : "outline"}>{table.active ? copy.tables.active : "-"}</Badge>
      </TableCell>
      <TableCell colSpan={2}>
        <div className="flex items-center gap-2">
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button
            size="sm"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const count = Number(seatCount);
                if (!name.trim() || !Number.isFinite(count) || count < 1) {
                  setError("入力内容を確認してください。");
                  return;
                }
                const result = await updateTableAction(table.id, { name: name.trim(), seatCount: count });
                if (!result.ok) {
                  setError(result.message);
                  return;
                }
                router.refresh();
                onCancel();
              })
            }
          >
            {copy.tables.save}
          </Button>
          <Button size="sm" variant="outline" disabled={pending} onClick={onCancel}>
            {copy.tables.cancel}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function TableManagementList({ tables }: { tables: RestaurantTable[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [seatCount, setSeatCount] = useState("2");
  const [error, setError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {tables.length === 0 ? (
        <p className="text-sm text-muted-foreground">{copy.tables.empty}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{copy.tables.name}</TableHead>
              <TableHead>{copy.tables.seatCount}</TableHead>
              <TableHead>{copy.tables.active}</TableHead>
              <TableHead />
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {tables.map((table) =>
              editingId === table.id ? (
                <EditRow key={table.id} table={table} onCancel={() => setEditingId(null)} />
              ) : (
                <TableRow key={table.id}>
                  <TableCell>{table.name}</TableCell>
                  <TableCell>{copy.common.guests(table.seatCount)}</TableCell>
                  <TableCell>
                    <Badge variant={table.active ? "secondary" : "outline"}>
                      {table.active ? copy.tables.active : "-"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditingId(table.id)}>
                        {copy.tables.edit}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={() =>
                          startTransition(async () => {
                            await updateTableAction(table.id, { active: !table.active });
                            router.refresh();
                          })
                        }
                      >
                        {table.active ? copy.tables.deactivate : copy.tables.activate}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() =>
                        startTransition(async () => {
                          if (!window.confirm(copy.tables.deleteConfirm)) return;
                          const result = await deleteTableAction(table.id);
                          if (!result.ok) {
                            setDeleteError(result.message);
                            return;
                          }
                          setDeleteError(null);
                          router.refresh();
                        })
                      }
                    >
                      {copy.tables.delete}
                    </Button>
                  </TableCell>
                </TableRow>
              )
            )}
          </TableBody>
        </Table>
      )}
      {deleteError ? <p className="text-sm text-destructive">{deleteError}</p> : null}

      <div className="space-y-3 rounded-lg border border-border p-4">
        <p className="text-sm font-medium">{copy.tables.create}</p>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>{copy.tables.name}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{copy.tables.seatCount}</Label>
            <Input type="number" min={1} value={seatCount} onChange={(e) => setSeatCount(e.target.value)} />
          </div>
        </div>
        <Button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const count = Number(seatCount);
              if (!name.trim() || !Number.isFinite(count) || count < 1) {
                setError("入力内容を確認してください。");
                return;
              }
              await createTableAction({ name: name.trim(), seatCount: count });
              setError(null);
              setName("");
              setSeatCount("2");
              router.refresh();
            })
          }
        >
          {copy.tables.create}
        </Button>
      </div>
    </div>
  );
}
