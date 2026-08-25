"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { copy } from "@/lib/admin/copy";
import { updateLpCustomizationAction } from "@/lib/admin/actions";
import type { LpCustomization } from "@/lib/admin/mock-store";

export function LpCustomizationForm({ initial }: { initial: LpCustomization }) {
  const [settings, setSettings] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  return (
    <div className="space-y-4">
      <p className="rounded-md border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
        {copy.lpCustomization.note}
      </p>

      <div className="space-y-1.5">
        <Label>{copy.lpCustomization.displayName}</Label>
        <Input value={settings.displayName} onChange={(e) => setSettings({ ...settings, displayName: e.target.value })} />
      </div>
      <div className="space-y-1.5">
        <Label>{copy.lpCustomization.welcomeMessage}</Label>
        <Textarea
          value={settings.welcomeMessage}
          onChange={(e) => setSettings({ ...settings, welcomeMessage: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label>{copy.lpCustomization.accentColor}</Label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            className="h-8 w-12 rounded border border-input"
            value={settings.accentColorHex}
            onChange={(e) => setSettings({ ...settings, accentColorHex: e.target.value })}
          />
          <Input
            value={settings.accentColorHex}
            onChange={(e) => setSettings({ ...settings, accentColorHex: e.target.value })}
            className="w-32"
          />
        </div>
      </div>

      {saved ? <p className="text-sm text-muted-foreground">保存しました。</p> : null}
      <Button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await updateLpCustomizationAction(settings);
            setSaved(true);
          })
        }
      >
        {copy.lpCustomization.save}
      </Button>
    </div>
  );
}
