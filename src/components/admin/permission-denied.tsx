import { copy } from "@/lib/admin/copy";

// docs/screens.md 共通異常系: 403は「権限がありません」とだけ示し、
// 機能の存在自体は隠さない(サイドバーからは消さない)。
export function PermissionDenied() {
  return (
    <main className="mx-auto max-w-md space-y-2 p-6 text-center">
      <h1 className="font-heading text-xl font-semibold text-foreground">{copy.permission.title}</h1>
      <p className="text-sm text-muted-foreground">{copy.permission.body}</p>
    </main>
  );
}
