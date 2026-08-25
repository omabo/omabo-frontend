import { LpCustomizationForm } from "@/components/admin/lp-customization-form";
import { PermissionDenied } from "@/components/admin/permission-denied";
import { copy } from "@/lib/admin/copy";
import { getLpCustomization } from "@/lib/admin/mock-store";
import { getSession } from "@/lib/admin/session";

export default async function LpCustomizationPage() {
  const session = await getSession();
  if (session?.role === "staff") return <PermissionDenied />;

  const settings = getLpCustomization();

  return (
    <main className="mx-auto max-w-xl space-y-4 p-6">
      <h1 className="font-heading text-2xl font-semibold text-foreground">{copy.lpCustomization.title}</h1>
      <LpCustomizationForm initial={settings} />
    </main>
  );
}
