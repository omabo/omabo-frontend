import { CreateTenantForm } from "@/components/console/create-tenant-form";
import { consoleCopy } from "@/lib/console/copy";

export default function CreateTenantPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{consoleCopy.createTenant.title}</h1>
      <CreateTenantForm />
    </div>
  );
}
