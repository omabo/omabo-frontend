"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { copy } from "@/lib/admin/copy";
import {
  inviteAdminUserAction,
  setAdminUserActiveAction,
  setAdminUserRoleAction,
} from "@/lib/admin/actions";
import type { AdminUser, AdminUserRole } from "@/lib/admin/mock-store";

const ROLE_LABEL: Record<AdminUserRole, string> = {
  staff: copy.users.roleStaff,
  admin: copy.users.roleAdmin,
  super_admin: copy.users.roleSuperAdmin,
};

export function UserManagementTable({ users }: { users: AdminUser[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AdminUserRole>("staff");
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{copy.users.name}</TableHead>
            <TableHead>{copy.users.email}</TableHead>
            <TableHead>{copy.users.role}</TableHead>
            <TableHead>{copy.users.status}</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Select
                  value={user.role}
                  onValueChange={(v) =>
                    startTransition(async () => {
                      await setAdminUserRoleAction(user.id, (v ?? "staff") as AdminUserRole, user.email);
                      router.refresh();
                    })
                  }
                >
                  <SelectTrigger size="sm">
                    <SelectValue>{(v: AdminUserRole) => ROLE_LABEL[v]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">{copy.users.roleStaff}</SelectItem>
                    <SelectItem value="admin">{copy.users.roleAdmin}</SelectItem>
                    <SelectItem value="super_admin">{copy.users.roleSuperAdmin}</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Badge variant={user.active ? "secondary" : "outline"}>
                  {user.active ? copy.users.active : copy.users.inactive}
                </Badge>
              </TableCell>
              <TableCell>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await setAdminUserActiveAction(user.id, !user.active, user.email);
                      router.refresh();
                    })
                  }
                >
                  {user.active ? copy.users.deactivate : copy.users.activate}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="space-y-3 rounded-lg border border-border p-4">
        <p className="text-sm font-medium">{copy.users.invite}</p>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>{copy.users.name}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{copy.users.email}</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{copy.users.role}</Label>
            <Select value={role} onValueChange={(v) => setRole((v ?? "staff") as AdminUserRole)}>
              <SelectTrigger>
                <SelectValue>{(v: AdminUserRole) => ROLE_LABEL[v]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="staff">{copy.users.roleStaff}</SelectItem>
                <SelectItem value="admin">{copy.users.roleAdmin}</SelectItem>
                <SelectItem value="super_admin">{copy.users.roleSuperAdmin}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await inviteAdminUserAction({ name, email, role });
              if (!result.ok) {
                setError(result.message);
                return;
              }
              setError(null);
              setName("");
              setEmail("");
              setRole("staff");
              router.refresh();
            })
          }
        >
          {copy.users.invite}
        </Button>
      </div>
    </div>
  );
}
