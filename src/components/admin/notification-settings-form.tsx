"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { copy } from "@/lib/admin/copy";
import { updateNotificationSettingsAction } from "@/lib/admin/actions";
import type { NotificationSettings } from "@/lib/admin/mock-store";

const FIELDS: { key: keyof NotificationSettings; label: string }[] = [
  { key: "newReservation", label: copy.notificationSettings.newReservation },
  { key: "cancellation", label: copy.notificationSettings.cancellation },
  { key: "needsReview", label: copy.notificationSettings.needsReview },
  { key: "dailySummary", label: copy.notificationSettings.dailySummary },
];

export function NotificationSettingsForm({ initial }: { initial: NotificationSettings }) {
  const [settings, setSettings] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {FIELDS.map((field) => (
          <div key={field.key} className="flex items-center gap-2">
            <Checkbox
              id={field.key}
              checked={settings[field.key]}
              onCheckedChange={(checked) => {
                setSaved(false);
                setSettings((prev) => ({ ...prev, [field.key]: checked === true }));
              }}
            />
            <Label htmlFor={field.key}>{field.label}</Label>
          </div>
        ))}
      </div>
      {saved ? <p className="text-sm text-muted-foreground">保存しました。</p> : null}
      <Button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await updateNotificationSettingsAction(settings);
            setSaved(true);
          })
        }
      >
        {copy.notificationSettings.save}
      </Button>
    </div>
  );
}
