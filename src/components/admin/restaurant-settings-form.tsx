"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { copy } from "@/lib/admin/copy";
import { updateRestaurantSettingsAction } from "@/lib/admin/actions";
import type { RestaurantSettings } from "@/lib/admin/mock-store";

const DAY_LABEL: Record<string, string> = {
  mon: "月",
  tue: "火",
  wed: "水",
  thu: "木",
  fri: "金",
  sat: "土",
  sun: "日",
};

export function RestaurantSettingsForm({ initial }: { initial: RestaurantSettings }) {
  const [settings, setSettings] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>{copy.restaurantSettings.name}</Label>
          <Input value={settings.name} onChange={(e) => setSettings({ ...settings, name: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>{copy.restaurantSettings.timezone}</Label>
          <Input value={settings.timezone} onChange={(e) => setSettings({ ...settings, timezone: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>{copy.restaurantSettings.phone}</Label>
          <Input value={settings.phone} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>{copy.restaurantSettings.email}</Label>
          <Input value={settings.email} onChange={(e) => setSettings({ ...settings, email: e.target.value })} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>{copy.restaurantSettings.address}</Label>
          <Input value={settings.address} onChange={(e) => setSettings({ ...settings, address: e.target.value })} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="acceptingReservations"
          checked={settings.acceptingReservations}
          onCheckedChange={(checked) => setSettings({ ...settings, acceptingReservations: checked === true })}
        />
        <Label htmlFor="acceptingReservations">{copy.restaurantSettings.acceptingReservations}</Label>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">{copy.restaurantSettings.businessHours}</p>
        <div className="space-y-1.5">
          {settings.businessHours.map((hours, index) => (
            <div key={hours.day} className="flex items-center gap-2 text-sm">
              <span className="w-6">{DAY_LABEL[hours.day]}</span>
              <Checkbox
                checked={!hours.closed}
                onCheckedChange={(checked) => {
                  const next = [...settings.businessHours];
                  next[index] = { ...hours, closed: checked !== true };
                  setSettings({ ...settings, businessHours: next });
                }}
              />
              <Input
                type="time"
                className="w-28"
                disabled={hours.closed}
                value={hours.open}
                onChange={(e) => {
                  const next = [...settings.businessHours];
                  next[index] = { ...hours, open: e.target.value };
                  setSettings({ ...settings, businessHours: next });
                }}
              />
              <span>-</span>
              <Input
                type="time"
                className="w-28"
                disabled={hours.closed}
                value={hours.close}
                onChange={(e) => {
                  const next = [...settings.businessHours];
                  next[index] = { ...hours, close: e.target.value };
                  setSettings({ ...settings, businessHours: next });
                }}
              />
              {hours.closed ? <span className="text-muted-foreground">{copy.restaurantSettings.closed}</span> : null}
            </div>
          ))}
        </div>
      </div>

      {saved ? <p className="text-sm text-muted-foreground">{copy.restaurantSettings.saved}</p> : null}
      <Button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await updateRestaurantSettingsAction(settings);
            setSaved(true);
          })
        }
      >
        {copy.restaurantSettings.save}
      </Button>
    </div>
  );
}
