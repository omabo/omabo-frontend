import { PermissionDenied } from "@/components/admin/permission-denied";
import { RestaurantSettingsForm } from "@/components/admin/restaurant-settings-form";
import { copy } from "@/lib/admin/copy";
import { getRestaurantSettings } from "@/lib/admin/mock-store";
import { getSession } from "@/lib/admin/session";

export default async function RestaurantSettingsPage() {
  const session = await getSession();
  if (session?.role === "staff") return <PermissionDenied />;

  const settings = getRestaurantSettings();

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-6">
      <h1 className="font-heading text-2xl font-semibold text-foreground">{copy.restaurantSettings.title}</h1>
      <RestaurantSettingsForm initial={settings} />
    </main>
  );
}
