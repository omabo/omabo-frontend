import { NotificationSettingsForm } from "@/components/admin/notification-settings-form";
import { PermissionDenied } from "@/components/admin/permission-denied";
import { copy } from "@/lib/admin/copy";
import { getNotificationSettings } from "@/lib/admin/mock-store";
import { getSession } from "@/lib/admin/session";

export default async function NotificationSettingsPage() {
  const session = await getSession();
  if (session?.role === "staff") return <PermissionDenied />;

  const settings = getNotificationSettings();

  return (
    <main className="mx-auto max-w-xl space-y-4 p-6">
      <h1 className="font-heading text-2xl font-semibold text-foreground">{copy.notificationSettings.title}</h1>
      <NotificationSettingsForm initial={settings} />
    </main>
  );
}
